package com.shopmypham.modules.cart.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class CartUpdateQtyRequest {
  @Min(1) private int qty;
}
