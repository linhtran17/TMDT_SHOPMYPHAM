// src/main/java/com/shopmypham/modules/coupon/CouponUsageRepository.java
package com.shopmypham.modules.coupon;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
  boolean existsByCouponIdAndUserId(Long couponId, Long userId);
  Optional<CouponUsage> findByOrderId(Long orderId);

  /* =========================
     Analytics: Coupon usage
     ========================= */
  // Trả về [coupon_code(String), usageCount(BigInteger), totalDiscount(BigDecimal), impactedRevenue(BigDecimal)]
  @Query(value = """
    SELECT o.coupon_code,
           COUNT(u.id)                                   AS usageCount,
           COALESCE(SUM(o.discount_amount),0)            AS totalDiscount,
           COALESCE(SUM(o.total_amount + o.discount_amount),0) AS impactedRevenue
    FROM coupon_usage u
    JOIN orders o ON o.id = u.order_id
    WHERE o.created_at >= :from AND o.created_at < :to
      AND o.coupon_code IS NOT NULL
    GROUP BY o.coupon_code
    ORDER BY usageCount DESC
  """, nativeQuery = true)
  List<Object[]> aggCouponUsage(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
