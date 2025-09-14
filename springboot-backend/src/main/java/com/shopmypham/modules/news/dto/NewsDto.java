package com.shopmypham.modules.news.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class NewsDto {
  private Long id;
  private String title;
  private String slug;
  private String coverImageUrl;
  private String excerpt;
  private String content;
  private Boolean active;
  private Instant publishedAt;

  // thông tin hiển thị tác giả
  private Long authorId;
  private String authorName;
}
