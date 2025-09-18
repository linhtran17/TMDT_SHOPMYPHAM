// dto/ProductResponse.java (cập nhật)
package com.shopmypham.modules.product.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class ProductResponse {
  private Long id;
  private String name;
  private String sku;
  private BigDecimal price;
  private BigDecimal salePrice;
  private Integer stock;
  private String shortDesc;
  private String description;
  private Long categoryId;
  private String categoryName;
  private Boolean featured;
  private Boolean hasVariants;
  private Boolean active;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  private List<ProductImageDto> images;
  private List<VariantDto> variants;
  private List<AttributeDto> attributes;
}
