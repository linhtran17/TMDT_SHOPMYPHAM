// ProductImageRepository.java (đã có) – bổ sung query theo variant
package com.shopmypham.modules.product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
  List<ProductImage> findByProduct_IdOrderBySortOrderAscIdAsc(Long productId);
  List<ProductImage> findByVariant_IdOrderBySortOrderAscIdAsc(Long variantId);
  boolean existsById(Long id);
}
