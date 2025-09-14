package com.shopmypham.modules.product.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder
public class ProductResponse {
  private Long id;
  private String name;
  private String sku;
  private java.math.BigDecimal price;
  private Integer stock;
  private String description;
  private Long categoryId;
  private String categoryName;
  private java.time.LocalDateTime createdAt;
  private java.time.LocalDateTime updatedAt;

  private java.util.List<ProductImageDto> images; // <-- thêm
}