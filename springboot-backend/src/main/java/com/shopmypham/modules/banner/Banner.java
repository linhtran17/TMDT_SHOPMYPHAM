package com.shopmypham.modules.banner;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "banners")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Banner {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String title;

  @Column(name = "image_url", length = 1024, nullable = false)
  private String imageUrl;

  @Column(name = "public_id")
  private String publicId;

  @Column(length = 1024)
  private String link;

  @Column(name = "sort_order")
  private Integer sortOrder = 0;

  private Boolean active = true;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @PrePersist
  public void prePersist() {
    createdAt = updatedAt = LocalDateTime.now();
  }
  @PreUpdate
  public void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
