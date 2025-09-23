// src/main/java/com/shopmypham/modules/coupon/CouponUsageRepository.java
package com.shopmypham.modules.coupon;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
  boolean existsByCouponIdAndUserId(Long couponId, Long userId);
  Optional<CouponUsage> findByOrderId(Long orderId);
}
