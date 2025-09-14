package com.shopmypham.modules.product;

import lombok.Getter; import lombok.Setter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "products")
@Getter @Setter
public class Product {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)       private String name;
  @Column(unique = true)          private String sku;
  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal price;
  private Integer stock;
  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "category_id", nullable = false)
  private Long categoryId;

  @Column(name="created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;
  @Column(name="updated_at", insertable = false, updatable = false)
  private LocalDateTime updatedAt;
}
