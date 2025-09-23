// src/main/java/com/shopmypham/modules/coupon/dto/CouponValidateResponse.java
package com.shopmypham.modules.coupon.dto;

import lombok.Builder; import lombok.Data;
import java.math.BigDecimal;

@Data @Builder
public class CouponValidateResponse {
  private boolean valid;
  private String reason;             // nếu invalid
  private BigDecimal discountAmount; // nếu valid
  private String code;
}
