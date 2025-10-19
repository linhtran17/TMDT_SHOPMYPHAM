package com.shopmypham.modules.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

  @Query("""
    SELECT p FROM Product p
    WHERE (p.active = true OR p.active IS NULL)
      AND ( :noCatFilter = true OR p.categoryId IN :catIds )
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

  /**
   * Lọc theo thuộc tính sản phẩm (ProductAttribute):
   * - Nếu attrName null/empty -> bỏ qua lọc thuộc tính
   * - Nếu attrName có, attrVal null/empty -> chấp nhận mọi giá trị của attrName đó
   * - Nếu cả attrName & attrVal có -> LIKE theo value
   */
  @Query("""
    SELECT DISTINCT p FROM Product p
    LEFT JOIN ProductAttribute a ON a.product.id = p.id
    WHERE (p.active = true OR p.active IS NULL)
      AND ( :noCatFilter = true OR p.categoryId IN :catIds )
      AND (
           :q IS NULL OR :q = ''
           OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(COALESCE(p.sku, '')) LIKE LOWER(CONCAT('%', :q, '%'))
      )
      AND (
           :attrName IS NULL OR :attrName = ''
           OR ( LOWER(a.name) = LOWER(:attrName)
                AND ( :attrVal IS NULL OR :attrVal = '' OR LOWER(a.value) LIKE LOWER(CONCAT('%', :attrVal, '%')) )
              )
      )
    ORDER BY p.id DESC
  """)
  Page<Product> searchWithAttr(@Param("q") String q,
                               @Param("catIds") Collection<Long> catIds,
                               @Param("noCatFilter") boolean noCatFilter,
                               @Param("attrName") String attrName,
                               @Param("attrVal") String attrVal,
                               Pageable pageable);

  boolean existsBySku(String sku);

  boolean existsByCategoryId(Long categoryId);

  @Query(value = """
        SELECT p.category_id, COUNT(p.id)
        FROM products p
        WHERE p.category_id IN (:ids)
        GROUP BY p.category_id
      """, nativeQuery = true)
  List<Object[]> countByCategoryIds(@Param("ids") List<Long> ids);
}
