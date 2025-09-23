// src/main/java/com/shopmypham/modules/order/OrderRepository.java
package com.shopmypham.modules.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

  /* =========================
     Tìm kiếm danh sách đơn
     ========================= */
  @Query("""
    select o from Order o
    where (:q is null or :q='' or
           lower(o.orderCode) like lower(concat('%',:q,'%')) or
           lower(o.customerName) like lower(concat('%',:q,'%')) or
           lower(o.customerPhone) like lower(concat('%',:q,'%')))
      and (:status is null or o.status = :status)
      and (:from is null or o.createdAt >= :from)
      and (:to is null or o.createdAt < :to)
  """)
  Page<Order> search(@Param("q") String q,
                     @Param("status") OrderStatus status,
                     @Param("from") LocalDateTime from,
                     @Param("to") LocalDateTime to,
                     Pageable pageable);

  boolean existsByOrderCode(String code);

  Page<Order> findByUserId(Long userId, Pageable pageable);

  /* =========================
     Analytics / Reporting
     ========================= */

  // KPI tổng quan: trả về 1 hàng: [totalOrders(BigInteger), totalRevenue(BigDecimal), paidOrders(BigInteger), paidRevenue(BigDecimal)]
  @Query(value = """
    SELECT
      COUNT(*)                                                   AS totalOrders,
      COALESCE(SUM(total_amount),0)                              AS totalRevenue,
      SUM(CASE WHEN payment_status='paid' THEN 1 ELSE 0 END)     AS paidOrders,
      COALESCE(SUM(CASE WHEN payment_status='paid' THEN total_amount ELSE 0 END),0) AS paidRevenue
    FROM orders
    WHERE created_at >= :from AND created_at < :to
  """, nativeQuery = true)
  Object[] sumKpi(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

  // Đếm theo trạng thái: mỗi phần tử = [status(String), cnt(BigInteger)]
  @Query(value = """
    SELECT status, COUNT(*) AS cnt
    FROM orders
    WHERE created_at >= :from AND created_at < :to
    GROUP BY status
  """, nativeQuery = true)
  List<Object[]> countByStatus(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

  // Doanh thu theo ngày: mỗi phần tử = [date(Date), revenue(BigDecimal), orders(BigInteger)]
  @Query(value = """
    SELECT DATE(created_at) AS d,
           COALESCE(SUM(CASE WHEN payment_status='paid' THEN total_amount ELSE 0 END),0) AS rev,
           COUNT(*) AS orders
    FROM orders
    WHERE created_at >= :from AND created_at < :to
    GROUP BY DATE(created_at)
    ORDER BY d
  """, nativeQuery = true)
  List<Object[]> revenueByDay(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

  // Top sản phẩm: mỗi phần tử = [product_id(Long), name(String), sku(String), qty(BigDecimal/BigInteger), revenue(BigDecimal)]
  @Query(value = """
    SELECT oi.product_id,
           MAX(oi.product_name)        AS name,
           MAX(oi.product_sku)         AS sku,
           SUM(oi.quantity)            AS qty,
           SUM(oi.line_total)          AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.created_at >= :from AND o.created_at < :to
      AND (:categoryId IS NULL OR p.category_id = :categoryId)
    GROUP BY oi.product_id
    ORDER BY revenue DESC
    LIMIT :limit
  """, nativeQuery = true)
  List<Object[]> topProducts(@Param("from") LocalDateTime from,
                             @Param("to") LocalDateTime to,
                             @Param("categoryId") Long categoryId,
                             @Param("limit") int limit);

  // Số khách hàng duy nhất (distinct email)
  @Query(value = """
    SELECT COUNT(DISTINCT LOWER(customer_email))
    FROM orders
    WHERE created_at >= :from AND created_at < :to
  """, nativeQuery = true)
  long countDistinctCustomers(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

  // Tỉ lệ khách quay lại (%): trả về Double (có thể null nếu không có dữ liệu)
  @Query(value = """
    WITH t AS (
      SELECT LOWER(customer_email) AS em, COUNT(*) AS c
      FROM orders
      WHERE created_at >= :from AND created_at < :to
      GROUP BY LOWER(customer_email)
    )
    SELECT CASE WHEN COUNT(*)=0 THEN 0
           ELSE ROUND(100.0 * SUM(CASE WHEN c>1 THEN 1 ELSE 0 END) / COUNT(*), 2)
           END
    FROM t
  """, nativeQuery = true)
  Double repeatCustomerRate(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

  // Top tỉnh/thành: mỗi phần tử = [province(String), orders(BigInteger)]
  @Query(value = """
    SELECT COALESCE(shipping_province,'N/A') AS province, COUNT(*) AS orders
    FROM orders
    WHERE created_at >= :from AND created_at < :to
    GROUP BY COALESCE(shipping_province,'N/A')
    ORDER BY orders DESC
    LIMIT 10
  """, nativeQuery = true)
  List<Object[]> topProvinces(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
