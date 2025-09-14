package com.shopmypham.modules.category.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class CategoryResponse {
  private Long id;
  private String name;
  private String slug;
  private String description;
  private String createdAt; // ISO string cho nhẹ FE
  private String updatedAt;
}
