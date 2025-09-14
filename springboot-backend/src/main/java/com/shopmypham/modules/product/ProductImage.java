package com.shopmypham.modules.product;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductImage {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @Column(nullable = false, length = 1024)
  private String url;

  private String publicId;
  private String alt;
  private Integer sortOrder = 0;

  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist(){ createdAt = LocalDateTime.now(); }
}
