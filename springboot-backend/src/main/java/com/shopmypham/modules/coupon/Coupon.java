// src/main/java/com/shopmypham/modules/coupon/Coupon.java
package com.shopmypham.modules.coupon;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="coupons",
  indexes = {
    @Index(name="idx_coupons_active_window", columnList = "active,start_date,end_date"),
    @Index(name="ux_coupons_code", columnList = "code", unique = true)
  }
)
@Getter @Setter
public class Coupon {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

  @Column(nullable=false, length=50, unique=true) private String code;

  @Enumerated(EnumType.STRING) @Column(name="discount_type", nullable=false)
  private DiscountType discountType;

  @Column(name="discount_value", precision=10, scale=2, nullable=false)
  private BigDecimal discountValue;

  @Column(name="min_order_amount", precision=19, scale=2) private BigDecimal minOrderAmount = BigDecimal.ZERO;
  @Column(name="max_discount_amount", precision=19, scale=2) private BigDecimal maxDiscountAmount;

  @Column(name="start_date", nullable=false) private LocalDateTime startDate;
  @Column(name="end_date",   nullable=false) private LocalDateTime endDate;

  @Column(name="usage_limit") private Integer usageLimit;  // null = không giới hạn
  @Column(name="used_count")  private Integer usedCount = 0;

  @Column(nullable=false) private Boolean active = true;

  @Column(name="created_at", insertable=false, updatable=false) private LocalDateTime createdAt;
  @Column(name="updated_at", insertable=false, updatable=false) private LocalDateTime updatedAt;
}
