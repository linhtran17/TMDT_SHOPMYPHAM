package com.shopmypham.modules.order.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderItemDto {
  private Long id;
  private Long productId;
  private Long variantId;
  private String productSku;
  private String productName;
  private String optionsSnapshot; // JSON string (snapshot)
  private BigDecimal unitPrice;
  private Integer quantity;
  private BigDecimal lineTotal;
}
