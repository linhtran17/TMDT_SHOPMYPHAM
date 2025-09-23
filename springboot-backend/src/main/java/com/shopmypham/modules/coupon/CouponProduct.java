// src/main/java/com/shopmypham/modules/coupon/CouponProduct.java
package com.shopmypham.modules.coupon;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

@Entity @Table(name="coupon_products")
@IdClass(CouponProductId.class)
@Getter @Setter
public class CouponProduct {
  @Id @Column(name="coupon_id")  private Long couponId;
  @Id @Column(name="product_id") private Long productId;
}

class CouponProductId implements java.io.Serializable {
  public Long couponId; public Long productId;
}
