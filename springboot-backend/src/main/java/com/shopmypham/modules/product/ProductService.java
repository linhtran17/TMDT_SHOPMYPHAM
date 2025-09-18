package com.shopmypham.modules.product;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopmypham.core.api.PageResponse;
import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.category.CategoryRepository;
import com.shopmypham.modules.inventory.InventoryMovementRepository;
import com.shopmypham.modules.product.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

  private final ProductRepository productRepo;
  private final CategoryRepository categoryRepo;
  private final ProductImageRepository imageRepo;
  private final ProductVariantRepository variantRepo;
  private final ProductAttributeRepository attributeRepo;
  private final InventoryMovementRepository invRepo;

  private final ObjectMapper om = new ObjectMapper();

  // ===== Search & Get =====
  @Transactional(readOnly = true)
  public PageResponse<ProductResponse> search(String q, Long categoryId, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
    String keyword = (q == null || q.isBlank()) ? null : q.trim();
    Page<Product> p = productRepo.searchNative(categoryId, keyword, pageable);

    if (p.getContent().isEmpty()) {
      return new PageResponse<>(List.of(), p.getTotalElements(), p.getNumber(), p.getSize());
    }

    // Bulk stock cho products (chỉ cấp product)
    List<Long> productIds = p.getContent().stream().map(Product::getId).toList();
    Map<Long, Integer> productQty = invRepo.findProductStock(productIds).stream()
        .collect(Collectors.toMap(
            InventoryMovementRepository.ProductStockRow::getProductId,
            r -> Optional.ofNullable(r.getQty()).orElse(0)
        ));

    // Bulk variants của các product
    var variantsAll = variantRepo.findByProduct_IdInOrderByIdAsc(productIds);
    Map<Long, List<ProductVariant>> variantsByProduct = variantsAll.stream()
        .collect(Collectors.groupingBy(v -> v.getProduct().getId()));

    // Bulk stock cho variants
    Map<Long, Integer> variantQty;
    if (variantsAll.isEmpty()) {
      variantQty = Map.of();
    } else {
      List<Long> variantIds = variantsAll.stream().map(ProductVariant::getId).toList();
      variantQty = invRepo.findVariantStock(variantIds).stream()
          .collect(Collectors.toMap(
              InventoryMovementRepository.VariantStockRow::getVariantId,
              r -> Optional.ofNullable(r.getQty()).orElse(0)
          ));
    }

    // Map từng product -> dto (stock hiển thị: nếu có biến thể => tổng tồn biến thể; không thì lấy productQty)
    var items = p.getContent().stream().map(prod ->
        toDto(
            prod,
            productQty.getOrDefault(prod.getId(), 0),
            variantsByProduct.getOrDefault(prod.getId(), List.of()),
            variantQty
        )
    ).toList();

    return new PageResponse<>(items, p.getTotalElements(), p.getNumber(), p.getSize());
  }

  @Transactional(readOnly = true)
  public ProductResponse get(Long id) {
    var p = findById(id);

    int pQty = Optional.ofNullable(invRepo.productQty(id)).orElse(0);
    var variants = variantRepo.findByProduct_IdOrderByIdAsc(id);

    Map<Long, Integer> variantQty;
    if (variants.isEmpty()) {
      variantQty = Map.of();
    } else {
      var vIds = variants.stream().map(ProductVariant::getId).toList();
      variantQty = invRepo.findVariantStock(vIds).stream()
          .collect(Collectors.toMap(
              InventoryMovementRepository.VariantStockRow::getVariantId,
              r -> Optional.ofNullable(r.getQty()).orElse(0)
          ));
    }

    return toDto(p, pQty, variants, variantQty);
  }

  // ===== Create / Update / Delete =====
  @Transactional
  public Long create(ProductRequest req) {
    validateCategory(req.getCategoryId());
    if (req.getSku()!=null && !req.getSku().isBlank() && productRepo.existsBySku(req.getSku()))
      throw new BadRequestException("SKU đã tồn tại");

    var p = new Product();
    applyUpsertToEntity(p, req);
    productRepo.save(p);
    return p.getId();
  }

  @Transactional
  public void update(Long id, ProductRequest req) {
    var p = findById(id);
    validateCategory(req.getCategoryId());
    if (req.getSku()!=null && !req.getSku().isBlank()
        && !req.getSku().equals(p.getSku()) && productRepo.existsBySku(req.getSku()))
      throw new BadRequestException("SKU đã tồn tại");
    applyUpsertToEntity(p, req);
  }

  /**
   * Xoá sản phẩm:
   * - Nếu đã có movement ở product hoặc bất kỳ variant nào => soft-delete (active=false) cho product (+ variants).
   * - Nếu chưa có ràng buộc => xoá cứng: dọn images/attributes/variants trước rồi xoá product.
   */
  @Transactional
  public void delete(Long id) {
    var p = findById(id);

    boolean hasProductMov = invRepo.existsByProductId(id);

    var variants = variantRepo.findByProduct_IdOrderByIdAsc(id);
    boolean hasAnyVariantMov = variants.stream().anyMatch(v -> invRepo.existsByVariantId(v.getId()));

    if (hasProductMov || hasAnyVariantMov) {
      // Soft delete
      p.setActive(false);
      productRepo.save(p);
      for (var v : variants) {
        if (Boolean.TRUE.equals(v.getActive())) {
          v.setActive(false);
          variantRepo.save(v);
        }
      }
      return;
    }

    // Xoá cứng an toàn (không bị movement tham chiếu)
    var imgs = imageRepo.findByProduct_IdOrderBySortOrderAscIdAsc(id);
    if (!imgs.isEmpty()) imageRepo.deleteAll(imgs);

    var attrs = attributeRepo.findByProduct_IdOrderByIdAsc(id);
    if (!attrs.isEmpty()) attributeRepo.deleteAll(attrs);

    if (!variants.isEmpty()) variantRepo.deleteAll(variants);

    productRepo.delete(p);
  }

  private void applyUpsertToEntity(Product p, ProductRequest req){
    p.setName(req.getName());
    p.setSku(blankToNull(req.getSku()));
    p.setCategoryId(req.getCategoryId());
    p.setShortDesc(req.getShortDesc());
    p.setDescription(req.getDescription());
    p.setFeatured(Boolean.TRUE.equals(req.getFeatured()));
    p.setActive(Boolean.TRUE.equals(req.getActive()));
    p.setHasVariants(Boolean.TRUE.equals(req.getHasVariants()));

    if (Boolean.TRUE.equals(req.getHasVariants())) {
      // Khi có biến thể: price dùng làm mốc (0 nếu null), salePrice null
      p.setPrice(zeroIfNull(req.getPrice()));
      p.setSalePrice(null);
    } else {
      if (req.getPrice()==null)
        throw new BadRequestException("Giá sản phẩm bắt buộc khi không dùng biến thể");
      if (req.getSalePrice()!=null && req.getSalePrice().compareTo(req.getPrice())>0)
        throw new BadRequestException("Giá khuyến mãi không được lớn hơn giá");
      p.setPrice(req.getPrice());
      p.setSalePrice(req.getSalePrice());
    }
  }

  // ===== Variants =====
  @Transactional(readOnly = true)
  public List<VariantDto> listVariants(Long productId){
    var vs = variantRepo.findByProduct_IdOrderByIdAsc(productId);
    var ids = vs.stream().map(ProductVariant::getId).toList();
    Map<Long,Integer> vQty = ids.isEmpty()? Map.of()
        : invRepo.findVariantStock(ids).stream()
            .collect(Collectors.toMap(
                InventoryMovementRepository.VariantStockRow::getVariantId,
                r -> Optional.ofNullable(r.getQty()).orElse(0)
            ));
    return vs.stream().map(v -> toDto(v, vQty.getOrDefault(v.getId(), 0))).toList();
  }

  @Transactional
  public List<VariantDto> upsertVariants(Long productId, List<VariantUpsertDto> body){
    var p = findById(productId);

    // enforce: chỉ upsert khi product đã bật hasVariants
    if (!Boolean.TRUE.equals(p.getHasVariants())) {
      throw new BadRequestException("Sản phẩm chưa bật 'hasVariants'. Vui lòng bật trước khi thêm biến thể.");
    }

    var skusInPayload = new HashSet<String>();
    for (var v : body){
      if (v.getSku()==null || v.getSku().isBlank())
        throw new BadRequestException("Thiếu SKU ở một biến thể");
      String skuTrim = v.getSku().trim();
      if (!skusInPayload.add(skuTrim))
        throw new BadRequestException("Trùng SKU trong danh sách: " + skuTrim);
      if (v.getPrice()==null || v.getPrice().compareTo(BigDecimal.ZERO) < 0)
        throw new BadRequestException("Giá không hợp lệ ở SKU: " + skuTrim);
      if (v.getSalePrice()!=null && v.getSalePrice().compareTo(v.getPrice())>0)
        throw new BadRequestException("SalePrice > Price ở SKU: " + skuTrim);
    }

    Map<Long,ProductVariant> existed = variantRepo.findByProduct_IdOrderByIdAsc(productId)
        .stream().collect(Collectors.toMap(ProductVariant::getId, x->x));

    Set<Long> keepIds = new HashSet<>();
    for (var in : body){
      ProductVariant e = (in.getId()!=null) ? existed.get(in.getId()) : null;
      boolean isNew = (e == null);
      if (isNew){ e = new ProductVariant(); e.setProduct(p); }

      String newSku = in.getSku().trim();

      // Đảm bảo SKU unique ở DB (trừ chính record đang chỉnh)
      Long excludeId = isNew ? -1L : e.getId();
      if (variantRepo.existsBySkuAndIdNot(newSku, excludeId)) {
        throw new BadRequestException("SKU đã tồn tại: " + newSku);
      }

      e.setSku(newSku);
      e.setPrice(in.getPrice());
      e.setSalePrice(in.getSalePrice());
      e.setActive(Boolean.TRUE.equals(in.getActive()));
      e.setOptionsJson(writeJson(in.getOptions()));
      variantRepo.save(e);
      keepIds.add(e.getId());
    }

    // Xử lý các biến thể không còn trong payload
    for (var old : existed.values()) {
      if (!keepIds.contains(old.getId())) {
        if (invRepo.existsByVariantId(old.getId())) {
          // đã có movement: soft delete
          if (Boolean.TRUE.equals(old.getActive())) {
            old.setActive(false);
            variantRepo.save(old);
          }
        } else {
          // chưa phát sinh movement: xoá cứng
          variantRepo.deleteById(old.getId());
        }
      }
    }

    // Trả về danh sách mới nhất (kèm stock tính từ sổ kho)
    return listVariants(productId);
  }

  // ===== Attributes =====
  @Transactional(readOnly = true)
  public List<AttributeDto> listAttributes(Long productId){
    return attributeRepo.findByProduct_IdOrderByIdAsc(productId).stream().map(a ->
        AttributeDto.builder().id(a.getId()).name(a.getName()).value(a.getValue()).build()
    ).toList();
  }

  @Transactional
  public void upsertAttributes(Long productId, List<AttributeUpsertDto> body){
    var p = findById(productId);
    Map<Long,ProductAttribute> existed = attributeRepo.findByProduct_IdOrderByIdAsc(productId)
        .stream().collect(Collectors.toMap(ProductAttribute::getId, x->x));
    Set<Long> keep = new HashSet<>();

    for (var in : body){
      ProductAttribute a = (in.getId()!=null) ? existed.get(in.getId()) : null;
      if (a==null){ a = new ProductAttribute(); a.setProduct(p); }
      a.setName(in.getName().trim());
      a.setValue(in.getValue().trim());
      attributeRepo.save(a);
      keep.add(a.getId());
    }
    for (var old : existed.values()) if (!keep.contains(old.getId())) attributeRepo.deleteById(old.getId());
  }

  // ===== Images =====
  @Transactional
  public Long addImage(Long productId, String url, String publicId, String alt, Integer sortOrder, Long variantId) {
    var p = findById(productId);
    ProductVariant v = null;
    if (variantId != null){
      v = variantRepo.findById(variantId).orElseThrow(() -> new BadRequestException("Variant không tồn tại"));
      if (!Objects.equals(v.getProduct().getId(), productId))
        throw new BadRequestException("Variant không thuộc sản phẩm này");
    }

    var img = new ProductImage();
    img.setProduct(p);
    img.setVariant(v);
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

  // ===== Helpers & Mapping =====
  private Product findById(Long id) {
    return productRepo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));
  }

  private void validateCategory(Long categoryId){
    if (!categoryRepo.existsById(categoryId))
      throw new BadRequestException("Danh mục không hợp lệ");
    ensureLeafCategory(categoryId);
  }

  private void ensureLeafCategory(Long categoryId){
    if (categoryRepo.existsByParentId(categoryId)) {
      throw new BadRequestException("Chỉ được gán sản phẩm vào danh mục lá (không có danh mục con).");
    }
  }

  private String blankToNull(String s){ return (s==null || s.isBlank()) ? null : s.trim(); }

  private BigDecimal zeroIfNull(BigDecimal x){ return x==null ? BigDecimal.ZERO : x; }

  private String writeJson(Map<String,String> map){
    try { return map==null? null : om.writeValueAsString(map); }
    catch (Exception e){ throw new BadRequestException("options không hợp lệ"); }
  }

  private Map<String,String> readJson(String json){
    try { return json==null? null : om.readValue(json, new TypeReference<Map<String,String>>(){}); }
    catch (Exception e){ return null; }
  }

  private VariantDto toDto(ProductVariant v, int qty){
    return VariantDto.builder()
        .id(v.getId()).sku(v.getSku()).price(v.getPrice()).salePrice(v.getSalePrice())
        .stock(qty).active(v.getActive())
        .options(readJson(v.getOptionsJson()))
        .createdAt(v.getCreatedAt()).updatedAt(v.getUpdatedAt())
        .build();
  }

  private ProductResponse toDto(Product p,
                                int productQty,
                                List<ProductVariant> variants,
                                Map<Long,Integer> variantQtyMap) {
    var images = imageRepo.findByProduct_IdOrderBySortOrderAscIdAsc(p.getId());
    var categoryName = categoryRepo.findById(p.getCategoryId()).map(c -> c.getName()).orElse(null);
    var attrs = attributeRepo.findByProduct_IdOrderByIdAsc(p.getId()).stream().map(a ->
        AttributeDto.builder().id(a.getId()).name(a.getName()).value(a.getValue()).build()
    ).toList();

    var variantDtos = variants.stream()
        .map(v -> toDto(v, variantQtyMap.getOrDefault(v.getId(), 0)))
        .toList();

    // ✅ Stock hiển thị: nếu có biến thể => tổng tồn các variant; nếu không => tồn cấp product
    int displayStock = Boolean.TRUE.equals(p.getHasVariants())
        ? variants.stream().mapToInt(v -> variantQtyMap.getOrDefault(v.getId(), 0)).sum()
        : productQty;

    return ProductResponse.builder()
        .id(p.getId()).name(p.getName()).sku(p.getSku())
        .price(p.getPrice()).salePrice(p.getSalePrice()).stock(displayStock)
        .shortDesc(p.getShortDesc()).description(p.getDescription())
        .categoryId(p.getCategoryId()).categoryName(categoryName)
        .featured(p.getFeatured()).hasVariants(p.getHasVariants()).active(p.getActive())
        .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt())
        .images(images.stream().map(img -> ProductImageDto.builder()
            .id(img.getId()).url(img.getUrl()).publicId(img.getPublicId()).alt(img.getAlt())
            .sortOrder(img.getSortOrder()).variantId(img.getVariant()==null?null:img.getVariant().getId()).build())
            .toList())
        .variants(variantDtos)
        .attributes(attrs)
        .build();
  }
}
