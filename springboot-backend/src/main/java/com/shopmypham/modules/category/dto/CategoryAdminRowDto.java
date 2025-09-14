package com.shopmypham.modules.category.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class CategoryAdminRowDto {
  private Long id;
  private String name;
  private String slug;
  private Long parentId;
  private String description;
  private String imageUrl;
  private Integer sortOrder;
  private Boolean active;
  private Long children;   // số danh mục con trực tiếp
  private Long products;   // số sản phẩm trực tiếp trong danh mục
  private String createdAt;
  private String updatedAt;
}
