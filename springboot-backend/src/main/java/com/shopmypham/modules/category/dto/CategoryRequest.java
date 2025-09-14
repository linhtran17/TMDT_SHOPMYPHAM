package com.shopmypham.modules.category.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {
  @NotBlank private String name;
  private String slug;
  private String description;
  private String imageUrl;     // NEW
  private Integer sortOrder;   // NEW
  private Boolean active;      // NEW
  private Long parentId;
  private Boolean clearParent;
}
