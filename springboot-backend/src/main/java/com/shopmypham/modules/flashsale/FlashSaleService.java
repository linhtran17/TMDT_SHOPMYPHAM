package com.shopmypham.modules.flashsale;

import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.flashsale.dto.FlashSaleDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlashSaleService {

  private final FlashSaleRepository repo;

  /* ===== PUBLIC ===== */
  @Transactional(readOnly = true)
  public List<FlashDealDto> getActiveDeals(int limit) {
    var rows = repo.findActiveDeals(PageRequest.of(0, Math.max(1, limit)));
    return rows.stream().map(r -> FlashDealDto.builder()
        .productId(r.getProductId())
        .name(r.getName())
        .sku(r.getSku())
        .imageUrl(r.getImageUrl())
        .basePrice(r.getBasePrice())
        .finalPrice(r.getFinalPrice())
        .flashId(r.getFlashId())
        .flashName(r.getFlashName())
        .startAt(r.getStartAt())
        .endAt(r.getEndAt())
        .build()
    ).toList();
  }

  @Transactional(readOnly = true)
  public FlashSaleDto getBySlug(String slug) {
    var sale = repo.findBySlug(slug).orElseThrow(() -> new NotFoundException("Không tìm thấy flash sale"));
    var items = repo.findItemsBySlug(slug).stream().map(r -> FlashDealItemDto.builder()
        .id(null)
        .productId(r.getProductId())
        .name(r.getName())
        .sku(r.getSku())
        .imageUrl(r.getImageUrl())
        .basePrice(r.getBasePrice())
        .finalPrice(r.getFinalPrice())
        .dealPrice(r.getDealPrice())
        .sortOrder(r.getSortOrder())
        .build()
    ).toList();
    return FlashSaleDto.builder()
      .id(sale.getId()).name(sale.getName()).slug(sale.getSlug())
      .discountType(sale.getDiscountType()).discountValue(sale.getDiscountValue())
      .startAt(sale.getStartAt()).endAt(sale.getEndAt())
      .priority(sale.getPriority()).active(sale.getActive())
      .items(items).build();
  }

  /* ===== ADMIN ===== */
  @Transactional(readOnly = true)
  public PageResp<FlashSaleAdminListItem> adminList(String q, int page, int size) {
    var p = repo.findAdminPage(q, PageRequest.of(page, size));
    var items = p.getContent().stream().map(r -> new FlashSaleAdminListItem(
      r.getId(), r.getName(), r.getSlug(), r.getDiscountType(), r.getDiscountValue(),
      r.getStartAt(), r.getEndAt(), r.getPriority(), r.getActive(), r.getItemCount()
    )).toList();
    return new PageResp<>(items, p.getTotalElements(), p.getTotalPages(), p.getNumber(), p.getSize());
  }

  @Transactional(readOnly = true)
  public FlashSaleDto adminGet(Long id) {
    var sale = repo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy flash sale"));
    var items = repo.findAdminItems(id).stream().map(r -> FlashDealItemDto.builder()
        .id(r.getId())
        .productId(r.getProductId())
        .name(r.getName())
        .sku(r.getSku())
        .imageUrl(r.getImageUrl())
        .basePrice(r.getBasePrice())
        .finalPrice(r.getFinalPrice())
        .dealPrice(r.getDealPrice())
        .sortOrder(r.getSortOrder())
        .build()
    ).toList();
    return FlashSaleDto.builder()
      .id(sale.getId()).name(sale.getName()).slug(sale.getSlug())
      .discountType(sale.getDiscountType()).discountValue(sale.getDiscountValue())
      .startAt(sale.getStartAt()).endAt(sale.getEndAt())
      .priority(sale.getPriority()).active(sale.getActive())
      .items(items).build();
  }

  @Transactional
  public Long adminCreate(FlashSaleUpsertReq req) {
    var s = new FlashSale();
    s.setName(req.getName().trim());
    s.setSlug(req.getSlug().trim());
    s.setDiscountType(req.getDiscountType());
    s.setDiscountValue(req.getDiscountValue());
    s.setStartAt(req.getStartAt());
    s.setEndAt(req.getEndAt());
    s.setPriority(req.getPriority() == null ? 0 : req.getPriority());
    s.setActive(req.getActive() == null || req.getActive());
    return repo.save(s).getId();
  }

  @Transactional
  public void adminUpdate(Long id, FlashSaleUpsertReq req) {
    var s = repo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy flash sale"));
    s.setName(req.getName().trim());
    s.setSlug(req.getSlug().trim());
    s.setDiscountType(req.getDiscountType());
    s.setDiscountValue(req.getDiscountValue());
    s.setStartAt(req.getStartAt());
    s.setEndAt(req.getEndAt());
    s.setPriority(req.getPriority() == null ? 0 : req.getPriority());
    s.setActive(req.getActive() == null || req.getActive());
    repo.save(s);
  }

  @Transactional
  public void adminSetActive(Long id, boolean active) {
    var s = repo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy flash sale"));
    s.setActive(active);
    repo.save(s);
  }

  @Transactional
  public void adminDelete(Long id) {
    if (!repo.existsById(id)) throw new NotFoundException("Không tìm thấy flash sale");
    repo.deleteById(id);
  }

  /* Items */
  @Transactional(readOnly = true)
  public List<FlashDealItemDto> adminListItems(Long saleId) {
    return repo.findAdminItems(saleId).stream().map(r -> FlashDealItemDto.builder()
      .id(r.getId()).productId(r.getProductId()).name(r.getName()).sku(r.getSku())
      .imageUrl(r.getImageUrl()).basePrice(r.getBasePrice()).finalPrice(r.getFinalPrice())
      .dealPrice(r.getDealPrice()).sortOrder(r.getSortOrder()).build()
    ).toList();
  }

  @Transactional
  public void adminAddItem(Long saleId, Long productId, BigDecimal dealPrice, Integer sortOrder) {
    var sale = repo.findById(saleId).orElseThrow(() -> new NotFoundException("Không tìm thấy flash sale"));
    if (repo.existsItem(sale.getId(), productId) > 0) return;
    repo.insertItem(sale.getId(), productId, dealPrice, sortOrder == null ? 0 : sortOrder);
  }

  @Transactional
  public void adminUpdateItem(Long saleId, Long itemId, BigDecimal dealPrice, Integer sortOrder) {
    var n = repo.updateItem(saleId, itemId, dealPrice, sortOrder);
    if (n == 0) throw new NotFoundException("Không tìm thấy item");
  }

  @Transactional
  public void adminRemoveItem(Long saleId, Long itemId) {
    var n = repo.deleteItem(saleId, itemId);
    if (n == 0) throw new NotFoundException("Không tìm thấy item");
  }
}
