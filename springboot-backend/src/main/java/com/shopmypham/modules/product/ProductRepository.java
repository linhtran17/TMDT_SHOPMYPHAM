package com.shopmypham.modules.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

  @Query(
      value = """
        SELECT *
        FROM products p
        WHERE (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (
             :q IS NULL OR :q = ''
             OR LOWER(p.name) LIKE CONCAT('%', LOWER(:q), '%')
             OR LOWER(COALESCE(p.sku, '')) LIKE CONCAT('%', LOWER(:q), '%')
          )
        ORDER BY p.id DESC
      """,
      countQuery = """
        SELECT COUNT(*)
        FROM products p
        WHERE (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (
             :q IS NULL OR :q = ''
             OR LOWER(p.name) LIKE CONCAT('%', LOWER(:q), '%')
             OR LOWER(COALESCE(p.sku, '')) LIKE CONCAT('%', LOWER(:q), '%')
          )
      """,
      nativeQuery = true)
  Page<Product> searchNative(@Param("categoryId") Long categoryId,
                             @Param("q") String q,
                             Pageable pageable);

  boolean existsBySku(String sku);

  // ✳️ Dùng trong CategoryService.delete()
  boolean existsByCategoryId(Long categoryId);

  // ✳️ Dùng trong CategoryService.adminPage() để đếm sản phẩm theo danh mục
  @Query(value = "SELECT p.category_id, COUNT(p.id) FROM products p WHERE p.category_id IN (:ids) GROUP BY p.category_id", nativeQuery = true)
  List<Object[]> countByCategoryIds(@Param("ids") List<Long> ids);
}
