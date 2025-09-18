package com.shopmypham.modules.flashsale.dto;

import com.shopmypham.modules.flashsale.FlashSale;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class FlashSaleDto {
  private Long id;
  private String name;
  private String slug;
  private FlashSale.DiscountType discountType;
  private BigDecimal discountValue;
  private LocalDateTime startAt;
  private LocalDateTime endAt;
  private Integer priority;
  private Boolean active;
  private List<FlashDealItemDto> items;
}
