package com.shopmypham.modules.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

  // tồn kho (bỏ qua dòng đã soft-delete)
  @Query("select coalesce(sum(m.changeQty),0) from InventoryMovement m where m.deletedAt is null and m.productId=:pid and m.variantId is null")
  Integer productQty(@Param("pid") Long productId);

  @Query("select coalesce(sum(m.changeQty),0) from InventoryMovement m where m.deletedAt is null and m.variantId=:vid")
  Integer variantQty(@Param("vid") Long variantId);

  @Query("""
    select m.productId as productId, sum(m.changeQty) as qty
    from InventoryMovement m
    where m.deletedAt is null and m.productId in :ids and m.variantId is null
    group by m.productId
  """)
  List<ProductStockRow> findProductStock(@Param("ids") List<Long> productIds);
  interface ProductStockRow { Long getProductId(); Integer getQty(); }

  @Query("""
    select m.variantId as variantId, sum(m.changeQty) as qty
    from InventoryMovement m
    where m.deletedAt is null and m.variantId in :ids
    group by m.variantId
  """)
  List<VariantStockRow> findVariantStock(@Param("ids") List<Long> variantIds);
  interface VariantStockRow { Long getVariantId(); Integer getQty(); }

  boolean existsByProductId(Long productId);
  boolean existsByVariantId(Long variantId);

  // đã có bút toán đối ứng cho id này chưa?
  boolean existsByReversedOfId(Long id);

  @Query("""
    select m from InventoryMovement m
    where m.deletedAt is null
      and (:productId is null or m.productId = :productId)
      and (:variantId is null or m.variantId = :variantId)
      and (:supplierId is null or m.supplierId = :supplierId)
      and (:reason is null or m.reason = :reason)
      and (:from is null or m.createdAt >= :from)
      and (:to is null or m.createdAt <= :to)
      and (:docNo is null or lower(coalesce(m.docNo,'')) like concat('%', lower(:docNo), '%'))
  """)
  Page<InventoryMovement> search(
      @Param("productId") Long productId,
      @Param("variantId") Long variantId,
      @Param("supplierId") Long supplierId,
      @Param("reason") InventoryReason reason,
      @Param("from") LocalDateTime from,
      @Param("to") LocalDateTime to,
      @Param("docNo") String docNo,
      Pageable pageable
  );

  // Low-stock
  @Query(value = """
    SELECT p.id, p.name, p.sku, COALESCE(SUM(m.change_qty),0) AS stock
    FROM products p
    LEFT JOIN inventory_movements m
      ON m.product_id = p.id
     AND m.variant_id IS NULL
     AND m.deleted_at IS NULL
    WHERE p.active = 1
    GROUP BY p.id, p.name, p.sku
    HAVING stock <= :threshold
    ORDER BY stock ASC
    LIMIT :limit
  """, nativeQuery = true)
  List<Object[]> findLowStockProducts(@Param("threshold") int threshold, @Param("limit") int limit);

  // Lock các dòng xuất kho theo orderId
  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("update InventoryMovement m set m.locked = true where m.deletedAt is null and m.reason='order' and m.refId=:orderId")
  void lockByOrderId(@Param("orderId") Long orderId);
}
