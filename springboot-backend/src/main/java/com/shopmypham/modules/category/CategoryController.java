// src/main/java/com/shopmypham/modules/category/CategoryController.java
package com.shopmypham.modules.category;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.api.PageResponse;
import com.shopmypham.modules.category.dto.CategoryAdminRowDto;
import com.shopmypham.modules.category.dto.CategoryRequest;
import com.shopmypham.modules.category.dto.CategoryResponse;
import com.shopmypham.modules.category.dto.CategoryTreeDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.shopmypham.modules.category.dto.CategoryAdminRowDto;


import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

  private final CategoryService categoryService;
  

  /** Dành cho admin/role có quyền đọc */
  @GetMapping
  @PreAuthorize("hasAuthority('category:read')")
  public ApiResponse<PageResponse<CategoryResponse>> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    return ApiResponse.ok(categoryService.list(page, size));
  }

  /** Dành cho admin/role có quyền đọc */
  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('category:read')")
  public ApiResponse<CategoryResponse> get(@PathVariable Long id) {
    return ApiResponse.ok(categoryService.get(id));
  }

  /** Cây danh mục cho FE (public) */
  @GetMapping("/tree")
  public ApiResponse<List<CategoryTreeDto>> tree() {
    return ApiResponse.ok(categoryService.tree());
  }

  @PostMapping
  @PreAuthorize("hasAuthority('category:create')")
  public ApiResponse<Long> create(@Valid @RequestBody CategoryRequest req) {
    return ApiResponse.ok(categoryService.create(req));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('category:update')")
  public ApiResponse<Void> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
    categoryService.update(id, req);
    return ApiResponse.ok();
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('category:delete')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    categoryService.delete(id);
    return ApiResponse.ok();
  }
  @GetMapping("/admin")
  @PreAuthorize("hasAuthority('category:read') or hasRole('ADMIN')")
  public ApiResponse<PageResponse<CategoryAdminRowDto>> adminList(
      @RequestParam(required = false) String q,
      @RequestParam(defaultValue = "all") String type,
      @RequestParam(required = false) Boolean active,
      @RequestParam(required = false) Long parentId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size
  ){
    return ApiResponse.ok(categoryService.adminPage(q, type, active, parentId, page, size));
  }
}
