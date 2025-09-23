// src/main/java/com/shopmypham/modules/coupon/CouponProductRepository.java
package com.shopmypham.modules.coupon;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CouponProductRepository extends JpaRepository<CouponProduct, CouponProductId> {
  List<CouponProduct> findByCouponId(Long couponId);
}
