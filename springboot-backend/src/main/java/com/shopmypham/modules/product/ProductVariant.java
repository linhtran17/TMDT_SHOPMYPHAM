package com.shopmypham.modules.product;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="product_variants")
@Getter @Setter
public class ProductVariant {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name="product_id", nullable=false)
  private Product product;

  @Column(unique = true) private String sku;

  @Column(nullable=false, precision=19, scale=2) private BigDecimal price;
  @Column(name="sale_price", precision=19, scale=2) private BigDecimal salePrice;

  @Column(name="options_json", columnDefinition="json")
  private String optionsJson;

  @Column(nullable=false) private Boolean active = true;

  @Column(name="created_at", insertable=false, updatable=false)
  private LocalDateTime createdAt;

  @Column(name="updated_at", insertable=false, updatable=false)
  private LocalDateTime updatedAt;
}
