// src/main/java/com/shopmypham/modules/coupon/CouponCategoryRepository.java
package com.shopmypham.modules.coupon;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CouponCategoryRepository extends JpaRepository<CouponCategory, CouponCategoryId> {
  List<CouponCategory> findByCouponId(Long couponId);
}
