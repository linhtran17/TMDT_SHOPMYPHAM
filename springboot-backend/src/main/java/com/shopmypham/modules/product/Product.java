package com.shopmypham.modules.product;

import lombok.Getter; import lombok.Setter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter @Setter
public class Product {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false) private String name;
  @Column(unique = true)    private String sku;

  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal price = BigDecimal.ZERO;

  @Column(name="sale_price", precision = 19, scale = 2)
  private BigDecimal salePrice;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name="short_desc", length = 500)
  private String shortDesc;

  @Column(name = "category_id", nullable = false)
  private Long categoryId;

  @Column(nullable = false) private Boolean featured = false;

  @Column(name="has_variants", nullable = false)
  private Boolean hasVariants = false;

  @Column(nullable = false) private Boolean active = true;

  @Column(name="created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name="updated_at", insertable = false, updatable = false)
  private LocalDateTime updatedAt;
}
