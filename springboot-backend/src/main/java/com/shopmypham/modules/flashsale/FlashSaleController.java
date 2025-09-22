package com.shopmypham.modules.flashsale;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.flashsale.dto.FlashSaleDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class FlashSaleController {

  private final FlashSaleService service;

  /* ===== PUBLIC ===== */
  @GetMapping("/api/flash-sales/deals")
  public ApiResponse<List<FlashDealDto>> deals(@RequestParam(defaultValue = "8") int limit) {
    return ApiResponse.ok(service.getActiveDeals(limit));
  }

  @GetMapping("/api/flash-sales/{slug}")
  public ApiResponse<FlashSaleDto> bySlug(@PathVariable String slug) {
    return ApiResponse.ok(service.getBySlug(slug));
  }

  /* ===== ADMIN ===== */
  @GetMapping("/api/admin/flash-sales")
  public ApiResponse<PageResp<FlashSaleAdminListItem>> adminList(
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return ApiResponse.ok(service.adminList(q, page, size));
  }

  @GetMapping("/api/admin/flash-sales/{id}")
  public ApiResponse<FlashSaleDto> adminGet(@PathVariable Long id) {
    return ApiResponse.ok(service.adminGet(id));
  }

  @PostMapping("/api/admin/flash-sales")
  public ApiResponse<Long> adminCreate(@RequestBody FlashSaleUpsertReq req) {
    return ApiResponse.ok(service.adminCreate(req));
  }

  @PutMapping("/api/admin/flash-sales/{id}")
  public ApiResponse<Void> adminUpdate(@PathVariable Long id, @RequestBody FlashSaleUpsertReq req) {
    service.adminUpdate(id, req);
    return ApiResponse.ok();
  }

  @PatchMapping("/api/admin/flash-sales/{id}/active")
  public ApiResponse<Void> adminSetActive(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
    boolean active = Boolean.TRUE.equals(body.get("active"));
    service.adminSetActive(id, active);
    return ApiResponse.ok();
  }

  @DeleteMapping("/api/admin/flash-sales/{id}")
  public ApiResponse<Void> adminDelete(@PathVariable Long id) {
    service.adminDelete(id);
    return ApiResponse.ok();
  }

  /* Items */
  @GetMapping("/api/admin/flash-sales/{id}/items")
  public ApiResponse<List<FlashDealItemDto>> adminListItems(@PathVariable Long id) {
    return ApiResponse.ok(service.adminListItems(id));
  }

  @PostMapping("/api/admin/flash-sales/{id}/items")
  public ApiResponse<Void> adminAddItem(@PathVariable Long id, @RequestBody ItemReq payload) {
    service.adminAddItem(id, payload.productId(), payload.dealPrice(), payload.sortOrder());
    return ApiResponse.ok();
  }

  @PutMapping("/api/admin/flash-sales/{id}/items/{itemId}")
  public ApiResponse<Void> adminUpdateItem(@PathVariable Long id, @PathVariable Long itemId, @RequestBody ItemReq payload) {
    service.adminUpdateItem(id, itemId, payload.dealPrice(), payload.sortOrder());
    return ApiResponse.ok();
  }

  @DeleteMapping("/api/admin/flash-sales/{id}/items/{itemId}")
  public ApiResponse<Void> adminRemoveItem(@PathVariable Long id, @PathVariable Long itemId) {
    service.adminRemoveItem(id, itemId);
    return ApiResponse.ok();
  }

  record ItemReq(Long productId, BigDecimal dealPrice, Integer sortOrder) {}
}
