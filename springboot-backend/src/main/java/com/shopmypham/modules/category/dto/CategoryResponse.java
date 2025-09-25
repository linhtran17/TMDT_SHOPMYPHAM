package com.shopmypham.modules.category.dto;

import lombok.Builder;
import lombok.Data;
@Data @Builder
public class CategoryResponse {
  private Long id;
  private String name;
  private String slug;
  private String description;

  // Thêm các field cần cho FE form
  private String imageUrl;
  private Integer sortOrder;
  private Boolean active;
  private Long parentId;

  private String createdAt;
  private String updatedAt;
}
