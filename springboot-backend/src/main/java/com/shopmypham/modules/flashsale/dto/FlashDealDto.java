package com.shopmypham.modules.flashsale.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder
public class FlashDealDto {
  private Long productId;
  private String name;
  private String sku;
  private String imageUrl;
  private BigDecimal basePrice;
  private BigDecimal finalPrice;
  private Long flashId;
  private String flashName;
  private LocalDateTime startAt;
  private LocalDateTime endAt;
}
