package com.shopmypham.modules.category;

import com.shopmypham.core.api.PageResponse;
import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.category.dto.*;
import com.shopmypham.modules.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CategoryService {

  private final CategoryRepository categoryRepo;
  private final ProductRepository productRepo;

  private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

  // ===== PUBLIC =====
  @Transactional(readOnly = true)
  public PageResponse<CategoryResponse> list(int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
    Page<Category> p = categoryRepo.findAll(pageable);
    var items = p.getContent().stream().map(this::toDto).toList();
    return new PageResponse<>(items, p.getTotalElements(), p.getNumber(), p.getSize());
  }

  @Transactional(readOnly = true)
  public CategoryResponse get(Long id) {
    return toDto(findById(id));
  }

  @Transactional(readOnly = true)
  public List<CategoryTreeDto> tree() {
    // sort theo sortOrder rồi name để trả đúng thứ tự hiển thị
    List<Category> all = categoryRepo.findAll(
        Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("name"))
    );
    Map<Long, CategoryTreeDto> map = new LinkedHashMap<>();
    List<CategoryTreeDto> roots = new ArrayList<>();

    for (Category c : all) {
      map.put(c.getId(), CategoryTreeDto.builder()
          .id(c.getId())
          .name(c.getName())
          .slug(c.getSlug())
          .parentId(c.getParentId())
          .imageUrl(c.getImageUrl())                 // <-- map imageUrl
          .children(new ArrayList<>())
          .build());
    }
    for (Category c : all) {
      CategoryTreeDto node = map.get(c.getId());
      if (c.getParentId() == null) roots.add(node);
      else {
        CategoryTreeDto parent = map.get(c.getParentId());
        if (parent != null) parent.getChildren().add(node); else roots.add(node);
      }
    }
    sortRecursive(roots);
    return roots;
  }

  private void sortRecursive(List<CategoryTreeDto> list) {
    list.sort(Comparator.comparing(CategoryTreeDto::getName, String.CASE_INSENSITIVE_ORDER));
    for (CategoryTreeDto x : list) sortRecursive(x.getChildren());
  }

  // ===== ADMIN TABLE =====
  @Transactional(readOnly = true)
  public PageResponse<CategoryAdminRowDto> adminPage(
      String q, String type, Boolean active, Long parentId, int page, int size
  ) {
    var sort = Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("name"));
    var all = categoryRepo.findAll(sort);

    var filtered = all.stream()
        .filter(c -> q == null || q.isBlank()
            || c.getName().toLowerCase().contains(q.toLowerCase())
            || (c.getSlug()!=null && c.getSlug().toLowerCase().contains(q.toLowerCase())))
        .filter(c -> active == null || Objects.equals(active, c.getActive()))
        .filter(c -> parentId == null || Objects.equals(parentId, c.getParentId()))
        .filter(c -> "parent".equalsIgnoreCase(type) ? c.getParentId() == null
                 : "child".equalsIgnoreCase(type) ? c.getParentId() != null : true)
        .toList();

    int total = filtered.size();
    int from = Math.min(page * size, total);
    int to   = Math.min(from + size, total);
    var slice = filtered.subList(from, to);
    var ids = slice.stream().map(Category::getId).toList();

    Map<Long, Long> childCnt = new HashMap<>();
    if (!ids.isEmpty()) {
      for (Object[] row : categoryRepo.countChildrenByParentIds(ids)) {
        childCnt.put((Long) row[0], (Long) row[1]);
      }
    }

    Map<Long, Long> prodCnt = new HashMap<>();
    if (!ids.isEmpty()) {
      for (Object[] row : productRepo.countByCategoryIds(ids)) {
        prodCnt.put((Long) row[0], (Long) row[1]);
      }
    }

    var rows = slice.stream().map(c -> CategoryAdminRowDto.builder()
        .id(c.getId())
        .name(c.getName())
        .slug(c.getSlug())
        .parentId(c.getParentId())
        .description(c.getDescription())
        .imageUrl(c.getImageUrl())
        .sortOrder(c.getSortOrder())
        .active(c.getActive())
        .children(childCnt.getOrDefault(c.getId(), 0L))
        .products(prodCnt.getOrDefault(c.getId(), 0L))
        .createdAt(c.getCreatedAt()==null? null : FMT.format(c.getCreatedAt()))
        .updatedAt(c.getUpdatedAt()==null? null : FMT.format(c.getUpdatedAt()))
        .build()
    ).toList();

    return new PageResponse<>(rows, total, page, size);
  }

  // ===== CRUD =====
  @Transactional
  public Long create(CategoryRequest req) {
    if (req == null || req.getName() == null || req.getName().isBlank())
      throw new BadRequestException("Tên danh mục không được để trống");

    String name = req.getName().trim();
    if (categoryRepo.existsByName(name)) throw new BadRequestException("Tên danh mục đã tồn tại");

    var c = new Category();
    c.setName(name);
    c.setSlug((req.getSlug()==null || req.getSlug().isBlank()) ? slugify(name) : req.getSlug().trim());
    c.setDescription(req.getDescription());
    c.setImageUrl(req.getImageUrl());
    c.setSortOrder(req.getSortOrder()==null ? 0 : req.getSortOrder());
    c.setActive(req.getActive()==null ? true : req.getActive());

    if (req.getParentId()!=null) {
      var parent = categoryRepo.findById(req.getParentId())
          .orElseThrow(() -> new BadRequestException("Danh mục cha không hợp lệ"));
      c.setParentId(parent.getId());
    }
    categoryRepo.save(c);
    return c.getId();
  }

  @Transactional
  public void update(Long id, CategoryRequest req) {
    var c = findById(id);

    if (req.getName()!=null) {
      String newName = req.getName().trim();
      if (newName.isBlank()) throw new BadRequestException("Tên danh mục không được để trống");
      if (!c.getName().equalsIgnoreCase(newName) && categoryRepo.existsByName(newName))
        throw new BadRequestException("Tên danh mục đã tồn tại");
      c.setName(newName);
    }
    if (req.getSlug()!=null && !req.getSlug().isBlank()) c.setSlug(req.getSlug().trim());
    if (req.getDescription()!=null) c.setDescription(req.getDescription());
    if (req.getImageUrl()!=null) c.setImageUrl(req.getImageUrl());
    if (req.getSortOrder()!=null) c.setSortOrder(req.getSortOrder());
    if (req.getActive()!=null) c.setActive(req.getActive());

    if (req.getParentId()!=null) {
      if (req.getParentId().equals(c.getId())) throw new BadRequestException("Danh mục cha không hợp lệ");
      var parent = categoryRepo.findById(req.getParentId())
          .orElseThrow(() -> new BadRequestException("Danh mục cha không hợp lệ"));
      c.setParentId(parent.getId());
    } else if (Boolean.TRUE.equals(req.getClearParent())) {
      c.setParentId(null);
    }
    categoryRepo.save(c);
  }

  @Transactional
  public void delete(Long id) {
    if (!categoryRepo.existsById(id))
      throw new NotFoundException("Không tìm thấy danh mục");
    if (categoryRepo.existsByParentId(id))
      throw new BadRequestException("Danh mục đang có danh mục con, không thể xoá");
    if (productRepo.existsByCategoryId(id))
      throw new BadRequestException("Danh mục đang có sản phẩm, không thể xoá");
    categoryRepo.deleteById(id);
  }

  // ===== helpers =====
  private Category findById(Long id){
    return categoryRepo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));
  }

  private CategoryResponse toDto(Category c) {
    return CategoryResponse.builder()
        .id(c.getId())
        .name(c.getName())
        .slug(c.getSlug())
        .description(c.getDescription())
        .imageUrl(c.getImageUrl())
        .sortOrder(c.getSortOrder())
        .active(c.getActive())
        .parentId(c.getParentId())
        .createdAt(c.getCreatedAt()==null? null : FMT.format(c.getCreatedAt()))
        .updatedAt(c.getUpdatedAt()==null? null : FMT.format(c.getUpdatedAt()))
        .build();
  }

  private String slugify(String input) {
    String n = Normalizer.normalize(input, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9\\s-]", "")
        .replaceAll("\\s+", "-")
        .replaceAll("-{2,}", "-")
        .replaceAll("^-|-$", "");
    return n.isBlank() ? "cat" + System.currentTimeMillis() : n;
  }
}
