// src/main/java/com/shopmypham/modules/coupon/dto/CouponValidateRequest.java
package com.shopmypham.modules.coupon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CouponValidateRequest {
  @NotBlank private String code;
  @NotNull  private List<Item> items;

  @Data
  public static class Item {
    @NotNull private Long productId;
    private Long variantId;
    @NotNull private Integer quantity;
  }
}
