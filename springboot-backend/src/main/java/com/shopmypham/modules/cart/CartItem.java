package com.shopmypham.modules.cart;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(
  name="cart_items",
  uniqueConstraints = @UniqueConstraint(name="uk_cartitem_cart_prod_var", columnNames = {"cart_id","product_id","variant_id"})
)
@Getter @Setter
public class CartItem {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name="cart_id", nullable=false) private Long cartId;
  @Column(name="product_id", nullable=false) private Long productId;
  @Column(name="variant_id") private Long variantId;

  @Column(name="options_snapshot", columnDefinition="json")
  private String optionsSnapshot; // JSON lưu option tại thời điểm thêm

  @Column(nullable=false) private Integer quantity;

  @Column(name="created_at", insertable=false, updatable=false)
  private LocalDateTime createdAt;
  @Column(name="updated_at", insertable=false, updatable=false)
  private LocalDateTime updatedAt;
}
