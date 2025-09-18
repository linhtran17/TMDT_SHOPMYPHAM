// src/main/java/com/shopmypham/modules/flashsale/FlashSaleQueryRepository.java
package com.shopmypham.modules.flashsale;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@org.springframework.stereotype.Repository
public interface FlashSaleQueryRepository
    extends org.springframework.data.repository.Repository<FlashSale, Long> {

  interface FlashDealRow {
    Long getProductId();
    String getName();
    String getSku();
    BigDecimal getBasePrice();
    BigDecimal getFinalPrice();
    Long getFlashId();
    String getFlashName();
    LocalDateTime getStartAt();
    LocalDateTime getEndAt();
    String getImageUrl();
  }

  interface FlashDealItemRow {
    Long getProductId();
    String getName();
    String getSku();
    BigDecimal getBasePrice();
    BigDecimal getFinalPrice();
    BigDecimal getDealPrice();
    Integer getSortOrder();
    String getImageUrl();
  }

  @Query(value = """
    SELECT
      afd.product_id  AS productId,
      afd.name        AS name,
      afd.sku         AS sku,
      afd.base_price  AS basePrice,
      afd.final_price AS finalPrice,
      afd.flash_id    AS flashId,
      afd.flash_name  AS flashName,
      afd.start_at    AS startAt,
      afd.end_at      AS endAt,
      COALESCE(
        (SELECT url FROM product_images i
          WHERE i.product_id = afd.product_id AND i.variant_id IS NULL
          ORDER BY i.sort_order ASC, i.id ASC LIMIT 1),
        (SELECT url FROM product_images i2
          WHERE i2.product_id = afd.product_id
          ORDER BY i2.sort_order ASC, i2.id ASC LIMIT 1)
      ) AS imageUrl
    FROM v_active_flash_deals afd
    ORDER BY afd.priority DESC, afd.sort_order ASC
    """, nativeQuery = true)
  List<FlashDealRow> findActiveDeals(Pageable pageable);

  @Query(value = """
    SELECT
      p.id AS productId,
      p.name AS name,
      p.sku  AS sku,
      p.price AS basePrice,
      CASE
        WHEN fsi.deal_price IS NOT NULL THEN fsi.deal_price
        WHEN fs.discount_type='percentage' THEN ROUND(p.price * (1 - fs.discount_value/100), 0)
        WHEN fs.discount_type='fixed'      THEN GREATEST(p.price - fs.discount_value, 0)
        ELSE p.price
      END AS finalPrice,
      fsi.deal_price AS dealPrice,
      fsi.sort_order AS sortOrder,
      COALESCE(
        (SELECT url FROM product_images i
          WHERE i.product_id = p.id AND i.variant_id IS NULL
          ORDER BY i.sort_order ASC, i.id ASC LIMIT 1),
        (SELECT url FROM product_images i2
          WHERE i2.product_id = p.id
          ORDER BY i2.sort_order ASC, i2.id ASC LIMIT 1)
      ) AS imageUrl
    FROM flash_sales fs
    JOIN flash_sale_items fsi ON fsi.flash_sale_id = fs.id
    JOIN products p           ON p.id = fsi.product_id
    WHERE fs.slug = :slug
    ORDER BY fsi.sort_order ASC, p.id ASC
    """, nativeQuery = true)
  List<FlashDealItemRow> findItemsBySlug(@Param("slug") String slug);
}
