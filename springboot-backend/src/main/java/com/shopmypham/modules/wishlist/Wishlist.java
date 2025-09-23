// src/main/java/com/shopmypham/modules/wishlist/Wishlist.java
package com.shopmypham.modules.wishlist;

import com.shopmypham.modules.user.User;
import com.shopmypham.modules.product.Product;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
  name = "wishlists",
  uniqueConstraints = @UniqueConstraint(name="uk_wishlist_user_product", columnNames={"user_id","product_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Wishlist {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id", nullable=false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="product_id", nullable=false)
  private Product product;

  @Column(name="created_at", updatable=false)
  private LocalDateTime createdAt;

  @PrePersist
  void prePersist(){ if (createdAt == null) createdAt = LocalDateTime.now(); }

  /** Helper để tạo reference theo id, tránh query thừa */
  public static User userRef(Long id){ var u = new User(); u.setId(id); return u; }
  public static Product productRef(Long id){ var p = new Product(); p.setId(id); return p; }
}
