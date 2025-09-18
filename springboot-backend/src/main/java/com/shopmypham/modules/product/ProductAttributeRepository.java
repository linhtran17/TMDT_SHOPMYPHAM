// ProductAttributeRepository.java
package com.shopmypham.modules.product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, Long> {
  List<ProductAttribute> findByProduct_IdOrderByIdAsc(Long productId);
}
