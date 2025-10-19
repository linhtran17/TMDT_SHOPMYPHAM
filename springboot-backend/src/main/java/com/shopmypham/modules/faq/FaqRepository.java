package com.shopmypham.modules.faq;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, Long> {

  @Query("""
     SELECT f FROM Faq f
     WHERE f.enabled = true AND (
       LOWER(f.question) LIKE LOWER(CONCAT('%', :kw, '%')) OR
       LOWER(f.answerMd) LIKE LOWER(CONCAT('%', :kw, '%')) OR
       LOWER(COALESCE(f.tags, '')) LIKE LOWER(CONCAT('%', :kw, '%'))
     )
     ORDER BY f.updatedAt DESC
  """)
  List<Faq> searchTop(String kw, Pageable pageable);
}
