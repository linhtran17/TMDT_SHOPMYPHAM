package com.shopmypham.modules.inventory;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

  @Query("select coalesce(sum(m.changeQty),0) from InventoryMovement m where m.productId=:pid and m.variantId is null")
  Integer productQty(@Param("pid") Long productId);

  @Query("select coalesce(sum(m.changeQty),0) from InventoryMovement m where m.variantId=:vid")
  Integer variantQty(@Param("vid") Long variantId);

  @Query("""
    select m.productId as productId, sum(m.changeQty) as qty
    from InventoryMovement m
    where m.productId in :ids and m.variantId is null
    group by m.productId
  """)
  List<ProductStockRow> findProductStock(@Param("ids") List<Long> productIds);
  interface ProductStockRow { Long getProductId(); Integer getQty(); }

  @Query("""
    select m.variantId as variantId, sum(m.changeQty) as qty
    from InventoryMovement m
    where m.variantId in :ids
    group by m.variantId
  """)
  List<VariantStockRow> findVariantStock(@Param("ids") List<Long> variantIds);
  interface VariantStockRow { Long getVariantId(); Integer getQty(); }

  boolean existsByProductId(Long productId);
  boolean existsByVariantId(Long variantId);

  @Query("""
    select m from InventoryMovement m
    where (:productId is null or m.productId = :productId)
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
}
