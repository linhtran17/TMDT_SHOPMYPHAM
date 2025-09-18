// ProductController.java
package com.shopmypham.modules.product;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.api.PageResponse;
import com.shopmypham.modules.product.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
  private final ProductService service;

  // ===== CRUD Product =====
  @GetMapping
  public ApiResponse<PageResponse<ProductResponse>> search(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Long categoryId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size
  ) {
    return ApiResponse.ok(service.search(q, categoryId, page, size));
  }

  @GetMapping("/{id}")
  public ApiResponse<ProductResponse> get(@PathVariable Long id) {
    return ApiResponse.ok(service.get(id));
  }

  @PostMapping
  @PreAuthorize("hasAuthority('product:create')")
  public ApiResponse<Long> create(@Valid @RequestBody ProductRequest req) {
    return ApiResponse.ok(service.create(req));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('product:update')")
  public ApiResponse<Void> update(@PathVariable Long id, @Valid @RequestBody ProductRequest req) {
    service.update(id, req);
    return ApiResponse.ok();
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('product:delete')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok();
  }

  // ===== Images =====
  @PostMapping("/{id}/images")
  @PreAuthorize("hasAuthority('product:update')")
  public ApiResponse<Long> addImage(
      @PathVariable Long id,
      @RequestBody Map<String, Object> body
  ){
    String url = (String) body.get("url");
    if (url == null || url.isBlank()) {
      throw new com.shopmypham.core.exception.BadRequestException("Thiếu url ảnh");
    }
    String publicId = (String) body.get("publicId");
    String alt = (String) body.getOrDefault("alt", "");
    Integer sortOrder = body.get("sortOrder") == null ? 0 : ((Number) body.get("sortOrder")).intValue();
    Long variantId = body.get("variantId") == null ? null : ((Number) body.get("variantId")).longValue();

    return ApiResponse.ok(service.addImage(id, url, publicId, alt, sortOrder, variantId));
  }

  @DeleteMapping("/images/{imageId}")
  @PreAuthorize("hasAuthority('product:update')")
  public ApiResponse<Void> deleteImage(@PathVariable Long imageId){
    service.deleteImage(imageId);
    return ApiResponse.ok();
  }

  // ===== Variants =====
  @GetMapping("/{id}/variants")
  public ApiResponse<List<VariantDto>> listVariants(@PathVariable Long id){
    return ApiResponse.ok(service.listVariants(id));
  }

  @PutMapping("/{id}/variants")
  @PreAuthorize("hasAuthority('product:update')")
  public ApiResponse<List<VariantDto>> upsertVariants(
      @PathVariable Long id,
      @RequestBody List<@Valid VariantUpsertDto> body
  ){
    return ApiResponse.ok(service.upsertVariants(id, body)); // trả về list đã có ID
  }

  // ===== Attributes =====
  @GetMapping("/{id}/attributes")
  public ApiResponse<List<AttributeDto>> listAttributes(@PathVariable Long id){
    return ApiResponse.ok(service.listAttributes(id));
  }

  @PutMapping("/{id}/attributes")
  @PreAuthorize("hasAuthority('product:update')")
  public ApiResponse<Void> upsertAttributes(
      @PathVariable Long id,
      @RequestBody List<@Valid AttributeUpsertDto> body
  ){
    service.upsertAttributes(id, body);
    return ApiResponse.ok();
  }
}
