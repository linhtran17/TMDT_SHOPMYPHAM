package com.shopmypham.modules.category;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name="categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(nullable=false, unique=true) private String name;
  private String slug; private Boolean active = true;
}
