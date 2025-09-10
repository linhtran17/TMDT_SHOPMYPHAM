package com.shopmypham.modules.product;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name="products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(nullable=false) private String name;
  private String description; private String image; private Double price;
  private Boolean inStock = true; private Integer stockQty = 0;
  private Long categoryId; private Boolean bestSeller = false;
}
