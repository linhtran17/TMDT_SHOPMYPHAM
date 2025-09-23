// src/main/java/com/shopmypham/modules/coupon/CouponUsage.java
package com.shopmypham.modules.coupon;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name="coupon_usage",
  uniqueConstraints = {
    @UniqueConstraint(name="uk_coupon_order", columnNames={"order_id"}),
    @UniqueConstraint(name="uk_coupon_user",  columnNames={"coupon_id","user_id"})
  }
)
@Getter @Setter
public class CouponUsage {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Column(name="coupon_id", nullable=false) private Long couponId;
  @Column(name="user_id",   nullable=false) private Long userId;
  @Column(name="order_id",  nullable=false) private Long orderId;
  @Column(name="used_at", insertable=false, updatable=false) private LocalDateTime usedAt;
}
