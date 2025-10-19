package com.shopmypham.modules.inventory;

import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.inventory.dto.MovementCreateRequest;
import com.shopmypham.modules.inventory.dto.MovementDTO;
import com.shopmypham.modules.product.ProductRepository;
import com.shopmypham.modules.product.ProductVariantRepository;
import com.shopmypham.modules.order.OrderRepository;
import com.shopmypham.modules.order.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventoryService {

  private final InventoryMovementRepository repo;
  private final ProductRepository productRepo;
  private final ProductVariantRepository variantRepo;
  private final OrderRepository orderRepo;

  // ===== Stock =====
  @Transactional(readOnly = true)
  public int variantQty(long variantId){
    variantRepo.findById(variantId).orElseThrow(() -> new NotFoundException("Biến thể không tồn tại"));
    Integer qty = repo.variantQty(variantId);
    return qty == null ? 0 : qty;
  }

  @Transactional(readOnly = true)
  public int productQty(long productId){
    productRepo.findById(productId).orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại"));
    Integer qty = repo.productQty(productId);
    return qty == null ? 0 : qty;
  }

  // ===== Create =====
  @Transactional
  public MovementDTO create(MovementCreateRequest req){
    var p = productRepo.findById(req.getProductId())
        .orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại"));

    if (req.getVariantId() != null){
      var v = variantRepo.findById(req.getVariantId())
          .orElseThrow(() -> new NotFoundException("Biến thể không tồn tại"));
      if (!v.getProduct().getId().equals(p.getId())){
        throw new IllegalArgumentException("Variant không thuộc sản phẩm");
      }
    }

    int before = (req.getVariantId() == null) ? productQty(req.getProductId()) : variantQty(req.getVariantId());
    int after = before + req.getChangeQty();
    if (after < 0) throw new IllegalStateException("Tồn kho không đủ");

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

  // ===== List =====
  @Transactional(readOnly = true)
  public Page<MovementDTO> list(Long productId, Long variantId, Long supplierId, InventoryReason reason,
                                LocalDateTime from, LocalDateTime to, String docNo, int page, int size){
    String doc = (docNo==null || docNo.isBlank()) ? null : docNo.trim();
    Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size),
        Sort.by(Sort.Direction.DESC, "createdAt","id"));
    return repo.search(productId, variantId, supplierId, reason, from, to, doc, pageable)
               .map(MovementDTO::from);
  }

  // ===== Reverse (huỷ bút toán) — chỉ cho dòng KHÔNG gắn chứng từ =====
  @Transactional
  public MovementDTO reverse(long id){
    var src = repo.findById(id).orElseThrow(() -> new NotFoundException("Bút toán không tồn tại"));

    if (src.isDeleted())      throw new IllegalStateException("Bút toán đã bị xoá.");
    if (src.isLocked())       throw new IllegalStateException("Bút toán đã khoá (hệ thống) — không thể huỷ.");
    if (src.isReversal())     throw new IllegalStateException("Đây là bút toán đối ứng — không thể huỷ.");
    if (repo.existsByReversedOfId(id)) throw new IllegalStateException("Bút toán này đã có dòng đối ứng.");
    if (src.getRefId() != null)
      throw new IllegalStateException("Bút toán gắn chứng từ — thao tác tại màn hình chứng từ (huỷ đơn/hoàn hàng).");

    var rev = new InventoryMovement();
    rev.setProductId(src.getProductId());
    rev.setVariantId(src.getVariantId());
    rev.setChangeQty(-src.getChangeQty());
    rev.setReason(InventoryReason.adjustment);
    rev.setRefId(src.getRefId()); // null vì src không có ref
    rev.setSupplierId(src.getSupplierId());
    rev.setDocNo("REV-" + (src.getDocNo() == null ? "" : src.getDocNo()));
    rev.setReversedOfId(src.getId());
    rev.setLocked(false);

    int before = (src.getVariantId() == null) ? productQty(src.getProductId()) : variantQty(src.getVariantId());
    int after = before + rev.getChangeQty();
    if (after < 0) throw new IllegalStateException("Huỷ bút toán sẽ làm âm tồn.");

    var saved = repo.save(rev);

    // khóa dòng gốc để tránh lặp (tuỳ chính sách; có thể bỏ nếu muốn)
    src.setLocked(true);
    repo.save(src);

    return MovementDTO.from(saved);
  }

  // ===== Soft delete =====
  @Transactional
  public void softDelete(long id){
    var m = repo.findById(id).orElseThrow(() -> new NotFoundException("Bút toán không tồn tại"));
    if (m.isLocked()) throw new IllegalStateException("Bút toán đã khoá — không thể xoá.");
    if (repo.existsByReversedOfId(id)) throw new IllegalStateException("Đã có bút toán đối ứng — không thể xoá.");
    if (!m.isDeleted()) {
      m.setDeletedAt(LocalDateTime.now());
      repo.save(m);
    }
  }
  // ===== Chat helpers (bulk stock for chatbot) =====

@Transactional(readOnly = true)
public Map<Long, Map<String,Object>> checkForChat(List<Long> productIds){
  if (productIds == null || productIds.isEmpty()) return Map.of();

  // Dùng bulk query có sẵn của repo: findProductStock(List<Long>)
  var rows = repo.findProductStock(productIds); // InventoryMovementRepository.ProductStockRow

  Map<Long, Map<String,Object>> out = new HashMap<>();
  for (var r : rows){
    long pid = r.getProductId();
    int qty  = (r.getQty() == null) ? 0 : r.getQty();
    out.put(pid, Map.of(
        "inStock", qty > 0,
        "qty", qty
    ));
  }

  // Bổ sung những id không có record (xem như 0)
  for (Long id : productIds){
    out.putIfAbsent(id, Map.of("inStock", false, "qty", 0));
  }
  return out;
}

  
}
