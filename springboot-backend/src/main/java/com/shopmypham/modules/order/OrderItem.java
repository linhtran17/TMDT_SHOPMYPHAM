package com.shopmypham.modules.order;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="order_items")
@Getter @Setter
public class OrderItem {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name="order_id", nullable=false) private Long orderId;
  @Column(name="product_id", nullable=false) private Long productId;
  @Column(name="variant_id") private Long variantId;

  @Column(name="product_sku")  private String productSku;
  @Column(name="product_name", nullable=false) private String productName;

  @Column(name="options_snapshot", columnDefinition="json") private String optionsSnapshot;

  @Column(name="unit_price", precision=19, scale=2, nullable=false) private BigDecimal unitPrice;
  @Column(nullable=false) private Integer quantity;
  @Column(name="line_total", precision=19, scale=2, nullable=false) private BigDecimal lineTotal;

  @Column(name="created_at", insertable=false, updatable=false) private LocalDateTime createdAt;
}
