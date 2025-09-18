package com.shopmypham.modules.flashsale.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data @Builder
public class FlashDealItemDto {
  private Long productId;
  private String name;
  private String sku;
  private String imageUrl;
  private BigDecimal basePrice;
  private BigDecimal finalPrice;
  private BigDecimal dealPrice; // null => dùng rule chung
  private Integer sortOrder;
}
