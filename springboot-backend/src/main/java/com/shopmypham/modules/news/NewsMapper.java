package com.shopmypham.modules.news;

import com.shopmypham.modules.news.dto.NewsDto;

final class NewsMapper {
  private NewsMapper() {}

  static NewsDto toDto(News n) {
    if (n == null) return null;
    return NewsDto.builder()
        .id(n.getId())
        .title(n.getTitle())
        .slug(n.getSlug())
        .coverImageUrl(n.getCoverImageUrl())
        .excerpt(n.getExcerpt())
        .content(n.getContent())
        .active(n.getActive())
        .publishedAt(n.getPublishedAt())
        .authorId(n.getAuthor() != null ? n.getAuthor().getId() : null)
        .authorName(n.getAuthor() != null ? n.getAuthor().getFullName() : null)
        .build();
  }

  /** Áp patch từ DTO vào entity (không đụng đến author ở đây) */
  static void apply(News n, NewsDto d) {
    if (d.getTitle() != null) n.setTitle(d.getTitle());
    if (d.getSlug() != null) n.setSlug(d.getSlug());
    if (d.getCoverImageUrl() != null) n.setCoverImageUrl(d.getCoverImageUrl());
    if (d.getExcerpt() != null) n.setExcerpt(d.getExcerpt());
    if (d.getContent() != null) n.setContent(d.getContent());
    if (d.getActive() != null) n.setActive(Boolean.TRUE.equals(d.getActive()));
    if (d.getPublishedAt() != null) n.setPublishedAt(d.getPublishedAt());
  }
}
