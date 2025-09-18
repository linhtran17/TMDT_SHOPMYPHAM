package com.shopmypham.modules.cart.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class CartView {
  private List<CartLine> items;
  private BigDecimal subtotal;
  private BigDecimal shippingFee;
  private BigDecimal discount;
  private BigDecimal tax;
  private BigDecimal total;
}
