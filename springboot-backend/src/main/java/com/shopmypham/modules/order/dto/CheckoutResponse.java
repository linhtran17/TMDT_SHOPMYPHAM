package com.shopmypham.modules.order.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CheckoutResponse {
  private Long orderId;
  private String orderCode;
  private BigDecimal totalAmount;
}
