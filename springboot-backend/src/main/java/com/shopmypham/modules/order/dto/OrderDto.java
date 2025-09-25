// src/main/java/com/shopmypham/modules/order/dto/OrderDto.java
package com.shopmypham.modules.order.dto;

import com.shopmypham.modules.order.OrderStatus;
import com.shopmypham.modules.order.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
public class OrderDto {
  private Long id;
  private String orderCode;
  private Long userId;

  private OrderStatus status;
  private PaymentStatus paymentStatus;
  private String paymentMethod;

  private BigDecimal subtotalAmount;
  private BigDecimal discountAmount;
  private BigDecimal shippingFee;
  private BigDecimal taxAmount;
  private BigDecimal totalAmount;

  private String customerName;
  private String customerEmail;
  private String customerPhone;

  private String shippingProvince;
  private String shippingDistrict;
  private String shippingWard;
  private String shippingAddress1;
  private String shippingAddress2;

  private String note;

  // ✅ thời gian dùng Instant (UTC)
  private Instant createdAt;
  private Instant updatedAt;

  // có thể null nếu API list
  private List<OrderItemDto> items;
}
