package com.shopmypham.modules.product;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopmypham.core.api.PageResponse;
import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.category.Category;
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
  public PageResponse<ProductResponse> search(String q,
                                              Long categoryId,
                                              String catSlug,
                                              List<Long> childIds,
                                              int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
    String keyword = (q == null || q.isBlank()) ? null : q.trim();

    // Ưu tiên childIds nếu FE truyền; nếu không thì tự mở rộng categoryId/catSlug thành danh sách con cháu
    List<Long> ids = (childIds != null && !childIds.isEmpty())
        ? childIds
        : resolveCategoryIds(categoryId, catSlug);

    boolean noCatFilter = (ids == null || ids.isEmpty());

    // Hibernate vẫn bind param dù nhánh OR “short-circuit”, nên an toàn vẫn truyền 1 list không rỗng.
    List<Long> catIdsParam = noCatFilter ? List.of(-1L) : ids;

    Page<Product> p = productRepo.search(keyword, catIdsParam, noCatFilter, pageable);
    return mapPageToDto(p);
  }

  // === Search có lọc theo thuộc tính (ví dụ: Loại da = Dầu) ===
  @Transactional(readOnly = true)
  public PageResponse<ProductResponse> searchWithAttr(String q,
                                                      Long categoryId,
                                                      String catSlug,
                                                      List<Long> childIds,
                                                      String attrName,
                                                      String attrVal,
                                                      int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
    String keyword = (q == null || q.isBlank()) ? null : q.trim();

    List<Long> ids = (childIds != null && !childIds.isEmpty())
        ? childIds
        : resolveCategoryIds(categoryId, catSlug);

    boolean noCatFilter = (ids == null || ids.isEmpty());
    List<Long> catIdsParam = noCatFilter ? List.of(-1L) : ids;

    String an = (attrName == null || attrName.isBlank()) ? null : attrName.trim();
    String av = (attrVal  == null || attrVal.isBlank())  ? null : attrVal.trim();

    Page<Product> p = productRepo.searchWithAttr(keyword, catIdsParam, noCatFilter, an, av, pageable);
    return mapPageToDto(p);
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
        && !Objects.equals(req.getSku(), p.getSku()) && productRepo.existsBySku(req.getSku()))
      throw new BadRequestException("SKU đã tồn tại");
    applyUpsertToEntity(p, req);
  }

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

    // Xoá cứng
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
      // Khi có biến thể: price là mốc (0 nếu null), salePrice null
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

    for (var old : existed.values()) {
      if (!keepIds.contains(old.getId())) {
        if (invRepo.existsByVariantId(old.getId())) {
          if (Boolean.TRUE.equals(old.getActive())) {
            old.setActive(false);
            variantRepo.save(old);
          }
        } else {
          variantRepo.deleteById(old.getId());
        }
      }
    }
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
    try { return json==null? null : om.readValue(json, new TypeReference<Map<String,String>>(){}) ; }
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
    var categoryName = categoryRepo.findById(p.getCategoryId()).map(Category::getName).orElse(null);
    var attrs = attributeRepo.findByProduct_IdOrderByIdAsc(p.getId()).stream().map(a ->
        AttributeDto.builder().id(a.getId()).name(a.getName()).value(a.getValue()).build()
    ).toList();

    var variantDtos = variants.stream()
        .map(v -> toDto(v, variantQtyMap.getOrDefault(v.getId(), 0)))
        .toList();

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

  // ===== Chat helpers (for chatbot) =====
  @Transactional(readOnly = true)
  public List<Map<String,Object>> listForChat(Map<String,Object> args) {
    String q          = optStr(args.get("q"));
    Long categoryId   = optLong(args.get("categoryId"));
    String catSlug    = optStr(args.get("catSlug"));
    @SuppressWarnings("unchecked")
    List<Long> childIds = (List<Long>) args.getOrDefault("childIds", null);

    Integer limit     = Optional.ofNullable(optInt(args.get("limit"))).orElse(5);
    Integer priceMin  = optInt(args.get("priceMin"));   // (đơn vị: VND)
    Integer priceMax  = optInt(args.get("priceMax"));

    // NEW: attribute filters (ví dụ: "Loại da" / "Dầu")
    String attrName   = optStr(args.get("attrName"));
    String attrVal    = optStr(args.get("attrVal"));

    PageResponse<ProductResponse> page = (attrName != null || attrVal != null)
        ? searchWithAttr(q, categoryId, catSlug, childIds, attrName, attrVal, 0, Math.max(1, limit))
        : search      (q, categoryId, catSlug, childIds, 0, Math.max(1, limit));

    return page.getItems().stream()
        // Lọc theo khoảng giá nếu có (dùng effectivePrice = salePrice nếu != null, ngược lại = price)
        .filter(p -> withinPrice(p, priceMin, priceMax))
        .map(p -> {
          String image = (p.getImages()==null || p.getImages().isEmpty())
              ? null
              : p.getImages().get(0).getUrl();
          boolean inStock = p.getStock()!=null && p.getStock() > 0;

          Map<String,Object> card = new HashMap<>();
          card.put("id",        p.getId());
          card.put("name",      p.getName());
          card.put("image",     image);
          card.put("price",     toLong(p.getPrice()));
          card.put("salePrice", toLong(p.getSalePrice()));
          card.put("inStock",   inStock);
          // TODO: đổi theo route FE thực tế (slug nếu có)
          card.put("url",       "/product/" + p.getId());
          return card;
        })
        .toList();
  }

  // ===== Chat helpers (build cards by product ids, keep input order) =====
  @Transactional(readOnly = true)
  public List<Map<String,Object>> cardsByProductIds(List<Long> productIds){
    if (productIds == null || productIds.isEmpty()) return List.of();

    List<Map<String,Object>> out = new ArrayList<>(productIds.size());
    for (Long id : productIds){
      try {
        var p = get(id); // dùng hàm get(...) có sẵn → trả ProductResponse đầy đủ
        String image = (p.getImages()==null || p.getImages().isEmpty())
            ? null
            : p.getImages().get(0).getUrl();
        boolean inStock = p.getStock()!=null && p.getStock() > 0;

        Map<String,Object> card = new HashMap<>();
        card.put("id",        p.getId());
        card.put("name",      p.getName());
        card.put("image",     image);
        card.put("price",     toLong(p.getPrice()));
        card.put("salePrice", toLong(p.getSalePrice()));
        card.put("inStock",   inStock);
        card.put("url",       "/product/" + p.getId());   // nếu có slug thì thay ở đây
        out.add(card);
      } catch (Exception ignore) {
        // sản phẩm không tồn tại/đã xoá → bỏ qua id này
      }
    }
    return out;
  }

  private static String optStr(Object o){
    return (o==null) ? null : String.valueOf(o).trim();
  }
  private static Long optLong(Object o){
    try { return (o==null) ? null : Long.valueOf(String.valueOf(o)); }
    catch (Exception e){ return null; }
  }
  private static Integer optInt(Object o){
    try { return (o==null) ? null : Integer.valueOf(String.valueOf(o)); }
    catch (Exception e){ return null; }
  }
  private static Long toLong(BigDecimal x){
    return x==null ? null : x.longValue();
  }
  private static boolean withinPrice(ProductResponse p, Integer min, Integer max){
    BigDecimal eff = (p.getSalePrice()!=null) ? p.getSalePrice() : p.getPrice();
    if (eff == null) return true; // không có giá → không lọc
    long v = eff.longValue();
    if (min != null && v < min) return false;
    if (max != null && v > max) return false;
    return true;
  }

  /**
   * - Không truyền categoryId/catSlug -> trả về null (không lọc danh mục).
   * - Nếu truyền danh mục (cha hoặc con) -> trả về id của nó + toàn bộ con cháu (DFS).
   */
  private List<Long> resolveCategoryIds(Long categoryId, String catSlug){
    Category root = null;
    if (categoryId != null) {
      root = categoryRepo.findById(categoryId).orElse(null);
    } else if (catSlug != null && !catSlug.isBlank()) {
      root = categoryRepo.findBySlug(catSlug.trim()).orElse(null);
    }
    if (root == null) return null;

    // lấy toàn bộ danh mục, gom map<parentId, List<Category>>
    List<Category> all = categoryRepo.findAll(Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("name")));
    Map<Long, List<Category>> byParent = new HashMap<>();
    for (Category c : all) {
      Long pid = c.getParentId();
      if (pid != null) {
        byParent.computeIfAbsent(pid, k -> new ArrayList<>()).add(c);
      }
    }

    List<Long> ids = new ArrayList<>();
    Deque<Long> stack = new ArrayDeque<>();
    stack.push(root.getId());
    while (!stack.isEmpty()) {
      Long cur = stack.pop();
      ids.add(cur);
      for (Category ch : byParent.getOrDefault(cur, List.of())) {
        stack.push(ch.getId());
      }
    }
    return ids;
  }

  // ==== small utils
  private PageResponse<ProductResponse> mapPageToDto(Page<Product> p){
    if (p.getContent().isEmpty()) {
      return new PageResponse<>(List.of(), p.getTotalElements(), p.getNumber(), p.getSize());
    }
    // Bulk stock (cấp product)
    List<Long> productIds = p.getContent().stream().map(Product::getId).toList();
    Map<Long, Integer> productQty = invRepo.findProductStock(productIds).stream()
        .collect(Collectors.toMap(
            InventoryMovementRepository.ProductStockRow::getProductId,
            r -> Optional.ofNullable(r.getQty()).orElse(0)
        ));

    // Bulk variants
    var variantsAll = variantRepo.findByProduct_IdInOrderByIdAsc(productIds);
    Map<Long, List<ProductVariant>> variantsByProduct = variantsAll.stream()
        .collect(Collectors.groupingBy(v -> v.getProduct().getId()));

    // Bulk stock variants
    Map<Long, Integer> variantQty = variantsAll.isEmpty() ? Map.of() :
        invRepo.findVariantStock(variantsAll.stream().map(ProductVariant::getId).toList()).stream()
            .collect(Collectors.toMap(
                InventoryMovementRepository.VariantStockRow::getVariantId,
                r -> Optional.ofNullable(r.getQty()).orElse(0)
            ));

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
}
