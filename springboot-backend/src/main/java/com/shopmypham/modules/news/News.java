package com.shopmypham.modules.news;

import com.shopmypham.modules.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "news")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class News {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, unique = true, length = 180)
  private String slug;

  private String coverImageUrl;

  @Column(length = 500)
  private String excerpt;

  @Lob
  @Column(columnDefinition = "longtext")
  private String content;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "author_id", nullable = false)
  private User author;

  @Builder.Default
  private Boolean active = true;

  private Instant publishedAt;
  private Instant createdAt;
  private Instant updatedAt;

  @PrePersist
  void preInsert() {
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
    if (publishedAt == null) publishedAt = now;
    if (active == null) active = true;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
  }
}
