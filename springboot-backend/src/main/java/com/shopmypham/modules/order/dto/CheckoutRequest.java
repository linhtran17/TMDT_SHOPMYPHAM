package com.shopmypham.modules.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CheckoutRequest {
  @NotBlank private String customerName;
  @Email @NotBlank private String customerEmail;
  @NotBlank private String customerPhone;

  private String shippingProvince;
  private String shippingDistrict;
  private String shippingWard;
  private String shippingAddress1;
  private String shippingAddress2;

  private String note;
  private String couponCode;      // optional
  private String paymentMethod;   // "COD" (demo)

  // ✅ NEW: cho phép chọn item cụ thể trong cart để checkout
  private java.util.List<Long> itemIds;
}
