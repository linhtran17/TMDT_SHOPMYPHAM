package com.shopmypham.modules.cart.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.Map;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class CartLine {
  private Long id;
  private Long productId;
  private Long variantId;
  private String productName;
  private String productSku;
  private Map<String,String> options;
  private int qty;
  private BigDecimal unitPrice;    // đã re-price (sale/flash nếu có)
  private BigDecimal lineTotal;
  private Integer available;       // tồn còn lại (để FE hiển thị cảnh báo)
  private String thumbnail;
}
