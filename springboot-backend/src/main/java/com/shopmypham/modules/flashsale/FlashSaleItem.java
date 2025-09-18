package com.shopmypham.modules.flashsale;

import com.shopmypham.modules.product.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "flash_sale_items",
  uniqueConstraints = @UniqueConstraint(name="uk_fs_product", columnNames = {"flash_sale_id","product_id"})
)
@Getter @Setter
public class FlashSaleItem {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "flash_sale_id", nullable = false)
  private FlashSale flashSale;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @Column(name="deal_price", precision = 19, scale = 2)
  private BigDecimal dealPrice;

  @Column(name="sort_order")
  private Integer sortOrder = 0;

  @Column(name="created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;
}
