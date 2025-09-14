package com.shopmypham.modules.category;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
// ... package & import ...
@Entity @Table(name = "categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "parent_id")
  private Long parentId;

  @Column(nullable = false, length = 150, unique = true)
  private String name;

  @Column(length = 200, unique = true)
  private String slug;

  @Column(length = 255)
  private String description;

  @Column(name = "image_url", length = 500)
  private String imageUrl;

  @Column(name = "sort_order")
  private Integer sortOrder;

  @Column(name = "active")
  private Boolean active;

  @Column(name = "created_at", insertable = false, updatable = false)
  private java.time.LocalDateTime createdAt;

  @Column(name = "updated_at", insertable = false, updatable = false)
  private java.time.LocalDateTime updatedAt;
}
