package com.shopmypham.modules.product.dto;

import lombok.Builder; import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data @Builder
public class VariantDto {
  private Long id;
  private String sku;
  private BigDecimal price;
  private BigDecimal salePrice;
  private Integer stock;              // ✅ chỉ là số đọc từ sổ kho
  private Map<String,String> options;
  private Boolean active;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
