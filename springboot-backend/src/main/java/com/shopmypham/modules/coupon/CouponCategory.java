// src/main/java/com/shopmypham/modules/coupon/CouponCategory.java
package com.shopmypham.modules.coupon;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

@Entity @Table(name="coupon_categories")
@IdClass(CouponCategoryId.class)
@Getter @Setter
public class CouponCategory {
  @Id @Column(name="coupon_id")   private Long couponId;
  @Id @Column(name="category_id") private Long categoryId;
}

class CouponCategoryId implements java.io.Serializable {
  public Long couponId; public Long categoryId;
}
