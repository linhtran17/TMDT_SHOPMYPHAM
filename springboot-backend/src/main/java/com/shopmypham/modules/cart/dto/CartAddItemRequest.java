package com.shopmypham.modules.cart.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Map;

@Data
public class CartAddItemRequest {
  @NotNull private Long productId;
  private Long variantId;             // nếu product có biến thể => bắt buộc
  @Min(1) private int qty = 1;
  private Map<String,String> options; // snapshot option
}
