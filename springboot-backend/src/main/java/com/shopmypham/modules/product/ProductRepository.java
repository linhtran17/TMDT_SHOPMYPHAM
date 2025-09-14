// src/main/java/com/shopmypham/modules/product/ProductRepository.java
package com.shopmypham.modules.product;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

  @Query(
      value = """
        SELECT *
        FROM products p
        WHERE (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (:name IS NULL OR :name = '' OR LOWER(p.name) LIKE CONCAT('%', LOWER(:name), '%'))
        ORDER BY p.created_at DESC
      """,
      countQuery = """
        SELECT COUNT(*)
        FROM products p
        WHERE (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (:name IS NULL OR :name = '' OR LOWER(p.name) LIKE CONCAT('%', LOWER(:name), '%'))
      """,
      nativeQuery = true
  )
  Page<Product> searchNative(@Param("categoryId") Long categoryId,
                             @Param("name") String name,
                             Pageable pageable);

  // GIỮ dễ hiểu: JPA tự sinh SQL, không native
  boolean existsBySku(String sku);

  // 🔑 quan trọng: bỏ @Query native, dùng derived query
  boolean existsByCategoryId(Long categoryId);

  @Query(value = "SELECT p.category_id, COUNT(p.id) FROM products p WHERE p.category_id IN (:ids) GROUP BY p.category_id", nativeQuery = true)
  List<Object[]> countByCategoryIds(@Param("ids") List<Long> ids);
}
