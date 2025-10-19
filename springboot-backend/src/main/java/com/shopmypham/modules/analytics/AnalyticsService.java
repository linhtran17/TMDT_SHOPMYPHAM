package com.shopmypham.modules.analytics;

import com.shopmypham.modules.order.OrderRepository;
import com.shopmypham.modules.inventory.InventoryMovementRepository;
import com.shopmypham.modules.product.ProductRepository;
import com.shopmypham.modules.coupon.CouponUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

  private final OrderRepository orderRepo;
  private final InventoryMovementRepository invRepo;
  private final ProductRepository productRepo;
  private final CouponUsageRepository couponUsageRepo;
  

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  public static record DayPoint(LocalDate date, BigDecimal revenue, long orders) {}
  public static record TopProductRow(Long productId, String name, String sku, long qty, BigDecimal revenue) {}
  public static record CouponUsageRow(String code, long usageCount, BigDecimal totalDiscount, BigDecimal impactedRevenue) {}
  public static record LowStockRow(Long productId, String name, String sku, int stock) {}

  private static Instant startOf(LocalDate d) {
    return d.atStartOfDay(ZONE).toInstant();
  }

  private static Instant endExclusive(LocalDate d) {
    return d.plusDays(1).atStartOfDay(ZONE).toInstant();
  }

  /* ========= SUMMARY ========= */
  @Cacheable(cacheNames = "analytics.summary",
      key = "#from.toString().concat(':').concat(#to.toString())",
      unless = "#result == null")
  public Map<String, Object> summary(Instant from, Instant to) {
    var m = new LinkedHashMap<String, Object>();

    Object raw = orderRepo.sumKpi(from, to);

    Object[] row;
    if (raw == null) {
      row = new Object[]{0, BigDecimal.ZERO, 0, BigDecimal.ZERO};
    } else if (raw instanceof Object[] a && !(a.length > 0 && a[0] instanceof Object[])) {
      row = a;
    } else if (raw instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Object[] a) {
      row = a;
    } else if (raw instanceof Object[] a && a.length == 1 && a[0] instanceof Object[] inner) {
      row = inner;
    } else {
      throw new IllegalStateException("Unexpected KPI result type: " + raw.getClass());
    }

    long totalOrders    = toLong(row.length > 0 ? row[0] : 0);
    BigDecimal totalRev = toBigDecimal(row.length > 1 ? row[1] : BigDecimal.ZERO);
    long paidOrders     = toLong(row.length > 2 ? row[2] : 0);
    BigDecimal paidRev  = toBigDecimal(row.length > 3 ? row[3] : BigDecimal.ZERO);

    m.put("totalOrders", totalOrders);
    m.put("totalRevenue", totalRev);
    m.put("paidOrders", paidOrders);
    m.put("paidRevenue", paidRev);
    m.put("aov", paidOrders == 0
        ? BigDecimal.ZERO
        : paidRev.divide(BigDecimal.valueOf(paidOrders), 0, java.math.RoundingMode.HALF_UP));

    m.put("activeProducts", productRepo.count());
    m.put("byStatus", orderRepo.countByStatus(from, to)); // List<Object[]>: [status, cnt]

    return m;
  }

  /* ========= SALES SERIES ========= */
  @Cacheable(cacheNames = "analytics.salesSeries",
      key = "#from.toString().concat(':').concat(#to.toString())",
      unless = "#result == null")
  public List<DayPoint> salesSeries(LocalDate from, LocalDate to) {
    var rows = orderRepo.revenueByDay(startOf(from), endExclusive(to));
    Map<LocalDate, DayPoint> map = new LinkedHashMap<>();
    LocalDate d = from;
    while (!d.isAfter(to)) {
      map.put(d, new DayPoint(d, BigDecimal.ZERO, 0));
      d = d.plusDays(1);
    }
    for (Object[] r : rows) {
      LocalDate day = ((java.sql.Date) r[0]).toLocalDate();
      BigDecimal rev = toBigDecimal(r[1]);
      long ord = toLong(r[2]);
      map.put(day, new DayPoint(day, rev, ord));
    }
    return new ArrayList<>(map.values());
  }

  /* ========= TOP PRODUCTS ========= */
  @Cacheable(cacheNames = "analytics.topProducts",
      key = "#from.toString().concat(':').concat(#to.toString()).concat(':').concat(String.valueOf(#categoryId)).concat(':').concat(String.valueOf(#limit))",
      unless = "#result == null")
  public List<TopProductRow> topProducts(LocalDate from, LocalDate to, Long categoryId, int limit) {
    var rows = orderRepo.topProducts(startOf(from), endExclusive(to), categoryId, limit);
    var list = new ArrayList<TopProductRow>(rows.size());
    for (Object[] r : rows) {
      list.add(new TopProductRow(
          toLong(r[0]),
          (String) r[1],
          (String) r[2],
          toLong(r[3]),
          toBigDecimal(r[4])
      ));
    }
    return list;
  }

  /* ========= COUPON USAGE =========
     (giữ LocalDateTime nếu repository coupon đang nhận LDT) */
  @Cacheable(cacheNames = "analytics.couponUsage",
      key = "#from.toString().concat(':').concat(#to.toString())",
      unless = "#result == null")
  public List<CouponUsageRow> couponUsage(LocalDate from, LocalDate to) {
    var rows = couponUsageRepo.aggCouponUsage(
        from.atStartOfDay(),           // nếu repo của bạn đổi sang Instant, convert tương tự như order
        to.plusDays(1).atStartOfDay()
    );
    var list = new ArrayList<CouponUsageRow>(rows.size());
    for (Object[] r : rows) {
      list.add(new CouponUsageRow(
          (String) r[0],
          toLong(r[1]),
          toBigDecimal(r[2]),
          toBigDecimal(r[3])
      ));
    }
    return list;
  }

  /* ========= LOW STOCK ========= */
  @Cacheable(cacheNames = "analytics.lowStock",
      key = "#threshold.toString().concat(':').concat(String.valueOf(#limit))",
      unless = "#result == null")
  public List<LowStockRow> lowStock(int threshold, int limit) {
    var rows = invRepo.findLowStockProducts(threshold, limit);
    var list = new ArrayList<LowStockRow>(rows.size());
    for (Object[] r : rows) {
      list.add(new LowStockRow(
          toLong(r[0]),
          (String) r[1],
          (String) r[2],
          toInt(r[3])
      ));
    }
    return list;
  }

  /* ========= CUSTOMERS OVERVIEW ========= */
  @Cacheable(cacheNames = "analytics.customersOverview",
      key = "#from.toString().concat(':').concat(#to.toString())",
      unless = "#result == null")
  public Map<String, Object> customersOverview(Instant from, Instant to) {
    var m = new LinkedHashMap<String, Object>();
    m.put("uniqueCustomers", orderRepo.countDistinctCustomers(from, to));
    m.put("repeatRate", Optional.ofNullable(orderRepo.repeatCustomerRate(from, to)).orElse(0.0d));
    m.put("topProvinces", orderRepo.topProvinces(from, to));
    return m;
  }

  /* ===== helpers ===== */
  private long toLong(Object o) {
    if (o == null) return 0L;
    if (o instanceof Number n) return n.longValue();
    return Long.parseLong(o.toString());
  }

  private int toInt(Object o) {
    if (o == null) return 0;
    if (o instanceof Number n) return n.intValue();
    return Integer.parseInt(o.toString());
  }

  private BigDecimal toBigDecimal(Object o) {
    if (o == null) return BigDecimal.ZERO;
    if (o instanceof BigDecimal b) return b;
    if (o instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
    return new BigDecimal(o.toString());
  }
}
