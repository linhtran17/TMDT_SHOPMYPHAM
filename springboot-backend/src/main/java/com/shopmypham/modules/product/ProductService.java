// src/main/java/com/shopmypham/modules/product/ProductService.java
package com.shopmypham.modules.product;

import com.shopmypham.core.api.PageResponse;
import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.category.CategoryRepository;
import com.shopmypham.modules.product.dto.ProductRequest;
import com.shopmypham.modules.product.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {
  private final ProductRepository productRepo;
  private final CategoryRepository categoryRepo;
  private final ProductImageRepository imageRepo;

  @Transactional(readOnly = true)
  public PageResponse<ProductResponse> search(String q, Long categoryId, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
    String keyword = (q == null || q.isBlank()) ? null : q.trim();
    Page<Product> p = productRepo.searchNative(categoryId, keyword, pageable);
    var items = p.getContent().stream().map(this::toDto).toList();
    return new PageResponse<>(items, p.getTotalElements(), p.getNumber(), p.getSize());
  }

  @Transactional(readOnly = true)
  public ProductResponse get(Long id) {
    return toDto(findById(id));
  }

  @Transactional
  public Long create(ProductRequest req) {
    if (req.getSku() != null && !req.getSku().isBlank() && productRepo.existsBySku(req.getSku()))
      throw new BadRequestException("SKU đã tồn tại");
    if (!categoryRepo.existsById(req.getCategoryId()))
      throw new BadRequestException("Danh mục không hợp lệ");

    ensureLeafCategory(req.getCategoryId()); // 👈 CHẶN: chỉ gán vào LÁ

    var p = new Product();
    p.setName(req.getName());
    p.setSku(blankToNull(req.getSku()));
    p.setPrice(req.getPrice());
    p.setStock(req.getStock() == null ? 0 : req.getStock());
    p.setDescription(req.getDescription());
    p.setCategoryId(req.getCategoryId());
    productRepo.save(p);
    return p.getId();
  }

  @Transactional
  public void update(Long id, ProductRequest req) {
    var p = findById(id);

    if (req.getSku() != null && !req.getSku().isBlank()
        && !req.getSku().equals(p.getSku()) && productRepo.existsBySku(req.getSku()))
      throw new BadRequestException("SKU đã tồn tại");
    if (!categoryRepo.existsById(req.getCategoryId()))
      throw new BadRequestException("Danh mục không hợp lệ");

    ensureLeafCategory(req.getCategoryId()); // 👈 CHẶN: chỉ gán vào LÁ

    p.setName(req.getName());
    p.setSku(blankToNull(req.getSku()));
    p.setPrice(req.getPrice());
    p.setStock(req.getStock() == null ? 0 : req.getStock());
    p.setDescription(req.getDescription());
    p.setCategoryId(req.getCategoryId());
  }

  @Transactional
  public void delete(Long id) {
    if (!productRepo.existsById(id))
      throw new NotFoundException("Không tìm thấy sản phẩm");
    productRepo.deleteById(id);
  }

  // ===== Images =====
  @Transactional
  public Long addImage(Long productId, String url, String publicId, String alt, Integer sortOrder) {
    var p = findById(productId);
    var img = new ProductImage();
    img.setProduct(p);
    img.setUrl(url);
    img.setPublicId(publicId);
    img.setAlt(alt);
    img.setSortOrder(sortOrder == null ? 0 : sortOrder);
    imageRepo.save(img);
    return img.getId();
  }

  @Transactional
  public void deleteImage(Long imageId) {
    if (!imageRepo.existsById(imageId))
      throw new NotFoundException("Ảnh không tồn tại");
    imageRepo.deleteById(imageId);
  }

  // ===== Helpers =====
  private void ensureLeafCategory(Long categoryId){
    // Nếu category có con → không phải lá.
    if (categoryRepo.existsByParentId(categoryId)) {
      throw new BadRequestException("Chỉ được gán sản phẩm vào danh mục lá (không có danh mục con).");
    }
  }

  private Product findById(Long id) {
    return productRepo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));
  }

  private String blankToNull(String s) {
    return (s == null || s.isBlank()) ? null : s.trim();
  }

  private ProductResponse toDto(Product p) {
    var images = imageRepo.findByProduct_IdOrderBySortOrderAscIdAsc(p.getId());
    String categoryName = categoryRepo.findById(p.getCategoryId())
        .map(cat -> cat.getName()).orElse(null);

    return ProductResponse.builder()
        .id(p.getId())
        .name(p.getName())
        .sku(p.getSku())
        .price(p.getPrice())
        .stock(p.getStock())
        .description(p.getDescription())
        .categoryId(p.getCategoryId())
        .categoryName(categoryName)
        .createdAt(p.getCreatedAt())
        .updatedAt(p.getUpdatedAt())
        .images(images.stream()
            .map(img -> com.shopmypham.modules.product.dto.ProductImageDto.builder()
              .id(img.getId()).url(img.getUrl()).publicId(img.getPublicId())
              .alt(img.getAlt()).sortOrder(img.getSortOrder()).build())
            .toList())
        .build();
  }
}
