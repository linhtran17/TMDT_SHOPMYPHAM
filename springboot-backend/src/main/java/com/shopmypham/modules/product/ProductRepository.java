package com.shopmypham.modules.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

  /**
   * Tìm kiếm theo từ khóa + nhiều categoryId.
   * - Khi không lọc danh mục: truyền noCatFilter=true (catIds có thể chứa “giá trị mồi”).
   * - Khi lọc danh mục: truyền noCatFilter=false và catIds là danh sách id cần lọc.
   *
   * JPQL, để tận dụng entity-level cache và portable.
   */
  @Query("""
    SELECT p FROM Product p
    WHERE
      (:noCatFilter = true OR p.categoryId IN :catIds)
      AND (
           :q IS NULL OR :q = ''
           OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(COALESCE(p.sku, '')) LIKE LOWER(CONCAT('%', :q, '%'))
      )
    ORDER BY p.id DESC
  """)
  Page<Product> search(@Param("q") String q,
                       @Param("catIds") Collection<Long> catIds,
                       @Param("noCatFilter") boolean noCatFilter,
                       Pageable pageable);

  boolean existsBySku(String sku);

  // Dùng trong CategoryService.delete()
  boolean existsByCategoryId(Long categoryId);

  // Dùng cho admin thống kê
  @Query(value =
      "SELECT p.category_id, COUNT(p.id) " +
      "FROM products p " +
      "WHERE p.category_id IN (:ids) " +
      "GROUP BY p.category_id",
      nativeQuery = true)
  List<Object[]> countByCategoryIds(@Param("ids") List<Long> ids);
}
