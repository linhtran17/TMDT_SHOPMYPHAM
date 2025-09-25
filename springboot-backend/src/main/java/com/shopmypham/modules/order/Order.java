package com.shopmypham.modules.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter
public class Order {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "order_code", nullable = false, unique = true)
  private String orderCode;

  @Column(name = "user_id")
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OrderStatus status = OrderStatus.pending;

  @Column(name = "payment_method")
  private String paymentMethod;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_status", nullable = false)
  private PaymentStatus paymentStatus = PaymentStatus.pending;

  @Column(name = "subtotal_amount", precision = 19, scale = 2, nullable = false)
  private BigDecimal subtotalAmount = BigDecimal.ZERO;

  @Column(name = "discount_amount", precision = 19, scale = 2, nullable = false)
  private BigDecimal discountAmount = BigDecimal.ZERO;

  @Column(name = "shipping_fee", precision = 19, scale = 2, nullable = false)
  private BigDecimal shippingFee = BigDecimal.ZERO;

  @Column(name = "tax_amount", precision = 19, scale = 2, nullable = false)
  private BigDecimal taxAmount = BigDecimal.ZERO;

  @Column(name = "total_amount", precision = 19, scale = 2, nullable = false)
  private BigDecimal totalAmount = BigDecimal.ZERO;

  @Column(name = "coupon_id")
  private Long couponId;

  @Column(name = "coupon_code", length = 50)
  private String couponCode;

  @Column(name = "customer_name", nullable = false)
  private String customerName;

  @Column(name = "customer_email", nullable = false)
  private String customerEmail;

  @Column(name = "customer_phone", nullable = false)
  private String customerPhone;

  @Column(name = "shipping_province")
  private String shippingProvince;

  @Column(name = "shipping_district")
  private String shippingDistrict;

  @Column(name = "shipping_ward")
  private String shippingWard;

  @Column(name = "shipping_address1")
  private String shippingAddress1;

  @Column(name = "shipping_address2")
  private String shippingAddress2;

  @Column(columnDefinition = "TEXT")
  private String note;

  // ✅ Để Hibernate set thời gian UTC
  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Transient
  private List<OrderItem> items;
}
