package com.shopmypham.modules.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
  List<ProductVariant> findByProduct_IdOrderByIdAsc(Long productId);

  // bulk fetch theo nhiều product_id, phục vụ trang list/search
  List<ProductVariant> findByProduct_IdInOrderByIdAsc(List<Long> productIds);

  boolean existsBySku(String sku);

  // ✅ thêm: check trùng SKU trừ chính nó (dùng trong upsert)
  boolean existsBySkuAndIdNot(String sku, Long id);
}
