// src/main/java/com/shopmypham/modules/category/dto/CategoryTreeDto.java
package com.shopmypham.modules.category.dto;

import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryTreeDto {
  private Long id;
  private String name;
  private String slug;
  private Long parentId;
  @Builder.Default
  private List<CategoryTreeDto> children = new ArrayList<>();
}
