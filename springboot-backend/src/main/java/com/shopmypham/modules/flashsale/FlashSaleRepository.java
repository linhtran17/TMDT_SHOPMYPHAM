package com.shopmypham.modules.flashsale;

import com.shopmypham.modules.flashsale.FlashSale.DiscountType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

public interface FlashSaleRepository extends JpaRepository<FlashSale, Long> {

  Optional<FlashSale> findBySlug(String slug);

  /* ===== Projections ===== */
  interface FlashDealRow {
    Long getProductId(); String getName(); String getSku();
    BigDecimal getBasePrice(); BigDecimal getFinalPrice();
    Long getFlashId(); String getFlashName();
    LocalDateTime getStartAt(); LocalDateTime getEndAt();
    String getImageUrl();
  }
  interface FlashDealItemRow {
    Long getProductId(); String getName(); String getSku();
    BigDecimal getBasePrice(); BigDecimal getFinalPrice();
    BigDecimal getDealPrice(); Integer getSortOrder(); String getImageUrl();
  }
  interface AdminItemRow {
    Long getId(); Long getProductId(); String getName(); String getSku();
    BigDecimal getBasePrice(); BigDecimal getFinalPrice();
    BigDecimal getDealPrice(); Integer getSortOrder(); String getImageUrl();
  }
  interface AdminListRow {
    Long getId(); String getName(); String getSlug();
    DiscountType getDiscountType(); BigDecimal getDiscountValue();
    LocalDateTime getStartAt(); LocalDateTime getEndAt();
    Integer getPriority(); Boolean getActive(); Long getItemCount();
  }

  /* ===== PUBLIC ===== */
  @Query(value = """
    SELECT
      p.id  AS productId,
      p.name AS name,
      p.sku AS sku,
      p.price AS basePrice,
      CASE
        WHEN fsi.deal_price IS NOT NULL THEN fsi.deal_price
        WHEN fs.discount_type='percentage' THEN ROUND(p.price * (1 - fs.discount_value/100), 0)
        WHEN fs.discount_type='fixed'      THEN GREATEST(p.price - fs.discount_value, 0)
        ELSE p.price
      END AS finalPrice,
      fs.id AS flashId,
      fs.name AS flashName,
      fs.start_at AS startAt,
      fs.end_at AS endAt,
      COALESCE(
        (SELECT url FROM product_images i WHERE i.product_id = p.id AND i.variant_id IS NULL
          ORDER BY i.sort_order ASC, i.id ASC LIMIT 1),
        (SELECT url FROM product_images i2 WHERE i2.product_id = p.id
          ORDER BY i2.sort_order ASC, i2.id ASC LIMIT 1)
      ) AS imageUrl
    FROM flash_sales fs
    JOIN flash_sale_items fsi ON fsi.flash_sale_id = fs.id
    JOIN products p           ON p.id = fsi.product_id
    WHERE fs.active = 1 AND CURRENT_TIMESTAMP BETWEEN fs.start_at AND fs.end_at
    ORDER BY fs.priority DESC, fsi.sort_order ASC
    """, nativeQuery = true)
  List<FlashDealRow> findActiveDeals(Pageable pageable);

  @Query(value = """
    SELECT
      p.id AS productId, p.name AS name, p.sku AS sku, p.price AS basePrice,
      CASE
        WHEN fsi.deal_price IS NOT NULL THEN fsi.deal_price
        WHEN fs.discount_type='percentage' THEN ROUND(p.price * (1 - fs.discount_value/100), 0)
        WHEN fs.discount_type='fixed'      THEN GREATEST(p.price - fs.discount_value, 0)
        ELSE p.price END AS finalPrice,
      fsi.deal_price AS dealPrice, fsi.sort_order AS sortOrder,
      COALESCE(
        (SELECT url FROM product_images i WHERE i.product_id = p.id AND i.variant_id IS NULL
          ORDER BY i.sort_order ASC, i.id ASC LIMIT 1),
        (SELECT url FROM product_images i2 WHERE i2.product_id = p.id
          ORDER BY i2.sort_order ASC, i2.id ASC LIMIT 1)
      ) AS imageUrl
    FROM flash_sales fs
    JOIN flash_sale_items fsi ON fsi.flash_sale_id = fs.id
    JOIN products p ON p.id = fsi.product_id
    WHERE fs.slug = :slug
    ORDER BY fsi.sort_order ASC, p.id ASC
    """, nativeQuery = true)
  List<FlashDealItemRow> findItemsBySlug(@Param("slug") String slug);

  /* ===== ADMIN: page + search ===== */
  @Query(value = """
    SELECT
      fs.id           AS id, fs.name AS name, fs.slug AS slug,
      fs.discount_type AS discountType, fs.discount_value AS discountValue,
      fs.start_at AS startAt, fs.end_at AS endAt,
      fs.priority AS priority, fs.active AS active,
      (SELECT COUNT(*) FROM flash_sale_items t WHERE t.flash_sale_id = fs.id) AS itemCount
    FROM flash_sales fs
    WHERE (:q IS NULL OR :q = '' OR fs.name LIKE CONCAT('%', :q, '%') OR fs.slug LIKE CONCAT('%', :q, '%'))
    ORDER BY fs.created_at DESC, fs.id DESC
    """,
    countQuery = """
      SELECT COUNT(1) FROM flash_sales fs
      WHERE (:q IS NULL OR :q = '' OR fs.name LIKE CONCAT('%', :q, '%') OR fs.slug LIKE CONCAT('%', :q, '%'))
    """,
    nativeQuery = true)
  org.springframework.data.domain.Page<AdminListRow> findAdminPage(@Param("q") String q, Pageable pageable);

  /* ===== ADMIN: items of a sale ===== */
  @Query(value = """
    SELECT
      fsi.id AS id, p.id AS productId, p.name AS name, p.sku AS sku, p.price AS basePrice,
      CASE
        WHEN fsi.deal_price IS NOT NULL THEN fsi.deal_price
        WHEN fs.discount_type='percentage' THEN ROUND(p.price * (1 - fs.discount_value/100), 0)
        WHEN fs.discount_type='fixed'      THEN GREATEST(p.price - fs.discount_value, 0)
        ELSE p.price END AS finalPrice,
      fsi.deal_price AS dealPrice, fsi.sort_order AS sortOrder,
      COALESCE(
        (SELECT url FROM product_images i WHERE i.product_id = p.id AND i.variant_id IS NULL
          ORDER BY i.sort_order ASC, i.id ASC LIMIT 1),
        (SELECT url FROM product_images i2 WHERE i2.product_id = p.id
          ORDER BY i2.sort_order ASC, i2.id ASC LIMIT 1)
      ) AS imageUrl
    FROM flash_sales fs
    JOIN flash_sale_items fsi ON fsi.flash_sale_id = fs.id
    JOIN products p ON p.id = fsi.product_id
    WHERE fs.id = :saleId
    ORDER BY fsi.sort_order ASC, p.id ASC
    """, nativeQuery = true)
  List<AdminItemRow> findAdminItems(@Param("saleId") Long saleId);

  /* ===== Item helpers ===== */
  @Modifying
  @Query(value = "INSERT INTO flash_sale_items (flash_sale_id, product_id, deal_price, sort_order) VALUES (:saleId, :productId, :dealPrice, :sortOrder)", nativeQuery = true)
  void insertItem(@Param("saleId") Long saleId, @Param("productId") Long productId,
                  @Param("dealPrice") BigDecimal dealPrice, @Param("sortOrder") Integer sortOrder);

  @Modifying
  @Query(value = "UPDATE flash_sale_items SET deal_price=:dealPrice, sort_order=:sortOrder WHERE id=:itemId AND flash_sale_id=:saleId", nativeQuery = true)
  int updateItem(@Param("saleId") Long saleId, @Param("itemId") Long itemId,
                 @Param("dealPrice") BigDecimal dealPrice, @Param("sortOrder") Integer sortOrder);

  @Modifying
  @Query(value = "DELETE FROM flash_sale_items WHERE id=:itemId AND flash_sale_id=:saleId", nativeQuery = true)
  int deleteItem(@Param("saleId") Long saleId, @Param("itemId") Long itemId);

  @Query(value = "SELECT COUNT(1) FROM flash_sale_items WHERE flash_sale_id=:saleId AND product_id=:productId", nativeQuery = true)
  long existsItem(@Param("saleId") Long saleId, @Param("productId") Long productId);
}
