package com.shopmypham.modules.news;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NewsRepository extends JpaRepository<News, Long> {
  Optional<News> findBySlug(String slug);
  List<News> findTop50ByActiveTrueOrderByPublishedAtDesc();
  boolean existsBySlug(String slug);
  boolean existsBySlugAndIdNot(String slug, Long id);
}
