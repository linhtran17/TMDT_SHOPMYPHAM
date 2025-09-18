package com.shopmypham.modules.product;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
// ProductImage.java
@Entity
@Table(name = "product_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductImage {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "variant_id")
  private ProductVariant variant; // nullable

  @Column(nullable = false, length = 1024)
  private String url;

  @Column(name = "public_id")
  private String publicId;

  private String alt;

  @Column(name = "sort_order")
  private Integer sortOrder = 0;

  @Column(name = "created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;
}
