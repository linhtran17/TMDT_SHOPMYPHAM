package com.shopmypham.modules.order.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

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
  private String paymentMethod;   // mặc định "COD" nếu null/blank

  // Cho phép chọn item cụ thể trong cart để checkout
  private List<Long> itemIds;
}
