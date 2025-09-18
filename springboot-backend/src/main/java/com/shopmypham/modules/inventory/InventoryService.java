package com.shopmypham.modules.inventory;

import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.inventory.dto.MovementCreateRequest;
import com.shopmypham.modules.inventory.dto.MovementDTO;
import com.shopmypham.modules.product.ProductRepository;
import com.shopmypham.modules.product.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InventoryService {

  private final InventoryMovementRepository repo;
  private final ProductRepository productRepo;
  private final ProductVariantRepository variantRepo;

  // tồn variant
  @Transactional(readOnly = true)
  public int variantQty(long variantId){
    // ensure variant tồn tại
    variantRepo.findById(variantId).orElseThrow(() -> new NotFoundException("Biến thể không tồn tại"));
    Integer qty = repo.variantQty(variantId); // <— KHỚP tên method trong Repository mới
    return qty == null ? 0 : qty;
  }

  // tồn product (chỉ tính movement cấp product — không gom variants)
  @Transactional(readOnly = true)
  public int productQty(long productId){
    productRepo.findById(productId).orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại"));
    Integer qty = repo.productQty(productId); // <— KHỚP tên method trong Repository mới
    return qty == null ? 0 : qty;
  }

  @Transactional
  public MovementDTO create(MovementCreateRequest req){
    // 1) validate product & variant link
    var p = productRepo.findById(req.getProductId())
        .orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại"));

    if (req.getVariantId() != null){
      var v = variantRepo.findById(req.getVariantId())
          .orElseThrow(() -> new NotFoundException("Biến thể không tồn tại"));
      if (!v.getProduct().getId().equals(p.getId())){
        throw new IllegalArgumentException("Variant không thuộc sản phẩm");
      }
    }

    // 2) không cho âm tồn
    int before = (req.getVariantId() == null)
        ? productQty(req.getProductId())
        : variantQty(req.getVariantId());
    int after = before + req.getChangeQty();
    if (after < 0) throw new IllegalStateException("Tồn kho không đủ");

    // 3) lưu movement
    var m = new InventoryMovement();
    m.setProductId(req.getProductId());
    m.setVariantId(req.getVariantId());
    m.setChangeQty(req.getChangeQty());
    m.setReason(req.getReason());
    m.setRefId(req.getRefId());
    m.setSupplierId(req.getSupplierId());
    m.setUnitCost(req.getUnitCost());
    m.setDocNo(req.getDocNo());
    var saved = repo.save(m);
    return MovementDTO.from(saved);
  }

  @Transactional(readOnly = true)
  public Page<MovementDTO> list(Long productId, Long variantId, Long supplierId, InventoryReason reason,
                                LocalDateTime from, LocalDateTime to, String docNo, int page, int size){
    String doc = (docNo==null || docNo.isBlank()) ? null : docNo.trim();
    Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size),
        Sort.by(Sort.Direction.DESC, "createdAt","id"));
    return repo.search(productId, variantId, supplierId, reason, from, to, doc, pageable)
               .map(MovementDTO::from);
  }

  @Transactional
  public void delete(long id){
    repo.deleteById(id);
  }
}
