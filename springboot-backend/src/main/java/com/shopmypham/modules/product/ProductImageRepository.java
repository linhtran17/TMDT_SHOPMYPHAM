package com.shopmypham.modules.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
  List<ProductImage> findByProduct_IdOrderBySortOrderAscIdAsc(Long productId);
  List<ProductImage> findByVariant_IdOrderBySortOrderAscIdAsc(Long variantId);
  boolean existsById(Long id);

  // Ảnh cover: ưu tiên ảnh không gắn variant; lấy ảnh có id nhỏ nhất cho mỗi sản phẩm
  @Query(value = """
      SELECT t.product_id, pi.url
      FROM (
        SELECT product_id, MIN(id) AS min_id
        FROM product_images
        WHERE variant_id IS NULL AND product_id IN (:ids)
        GROUP BY product_id
      ) t
      JOIN product_images pi ON pi.id = t.min_id
      """, nativeQuery = true)
  List<Object[]> findCoverUrlsByProductIds(@Param("ids") List<Long> productIds);
}
