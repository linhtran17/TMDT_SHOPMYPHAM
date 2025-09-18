package com.shopmypham.modules.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

  // ===== Số tồn đơn lẻ =====
  @Query("select coalesce(sum(m.changeQty), 0) from InventoryMovement m where m.variantId = :variantId")
  Integer variantQty(@Param("variantId") Long variantId);

  // Tồn cấp product (chỉ movement product-level, KHÔNG cộng biến thể)
  @Query("select coalesce(sum(m.changeQty), 0) from InventoryMovement m where m.productId = :productId and m.variantId is null")
  Integer productQty(@Param("productId") Long productId);

  // ===== Projection cho bulk stock =====
  interface ProductStockRow {
    Long getProductId();
    Integer getQty();
  }

  interface VariantStockRow {
    Long getVariantId();
    Integer getQty();
  }

  // Tổng tồn theo danh sách productId (chỉ cấp product)
  @Query("""
         select m.productId as productId, coalesce(sum(m.changeQty), 0) as qty
         from InventoryMovement m
         where m.productId in :ids and m.variantId is null
         group by m.productId
         """)
  List<ProductStockRow> findProductStock(@Param("ids") List<Long> productIds);

  // Tổng tồn theo danh sách variantId
  @Query("""
         select m.variantId as variantId, coalesce(sum(m.changeQty), 0) as qty
         from InventoryMovement m
         where m.variantId in :ids
         group by m.variantId
         """)
  List<VariantStockRow> findVariantStock(@Param("ids") List<Long> variantIds);

  // Kiểm tra đã có movement tham chiếu
  boolean existsByProductId(Long productId);
  boolean existsByVariantId(Long variantId);

  // ===== Tìm kiếm movement (phục vụ list/filter) =====
  @Query("""
    select m from InventoryMovement m
    where (:productId is null or m.productId = :productId)
      and (:variantId is null or m.variantId = :variantId)
      and (:supplierId is null or m.supplierId = :supplierId)
      and (:reason is null or m.reason = :reason)
      and (:from is null or m.createdAt >= :from)
      and (:to   is null or m.createdAt < :to)
      and (:docNo is null or lower(m.docNo) like lower(concat('%', :docNo, '%')))
    """)
  Page<InventoryMovement> search(@Param("productId") Long productId,
                                 @Param("variantId") Long variantId,
                                 @Param("supplierId") Long supplierId,
                                 @Param("reason") InventoryReason reason,
                                 @Param("from") LocalDateTime from,
                                 @Param("to") LocalDateTime to,
                                 @Param("docNo") String docNo,
                                 Pageable pageable);
}
