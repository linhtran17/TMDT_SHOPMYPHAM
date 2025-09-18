package com.shopmypham.modules.product;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name="product_attributes")
@Getter @Setter
public class ProductAttribute {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name="product_id", nullable=false)
  private Product product;

  @Column(nullable=false, length=100)
  private String name;

  @Column(nullable=false, length=255)
  private String value;

  @Column(name="created_at", insertable=false, updatable=false)
  private LocalDateTime createdAt;
}
