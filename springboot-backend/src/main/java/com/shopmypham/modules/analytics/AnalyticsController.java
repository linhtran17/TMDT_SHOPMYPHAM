package com.shopmypham.modules.analytics;

import com.shopmypham.core.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.*;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

  private final AnalyticsService service;

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private static Instant startOf(LocalDate d) {
    return d.atStartOfDay(ZONE).toInstant();
  }

  /** end exclusive = 00:00 ngày (to + 1) */
  private static Instant endExclusive(LocalDate d) {
    return d.plusDays(1).atStartOfDay(ZONE).toInstant();
  }

  @GetMapping("/summary")
  public ApiResponse<java.util.Map<String,Object>> summary(@RequestParam LocalDate from,
                                                           @RequestParam LocalDate to) {
    return ApiResponse.ok(service.summary(startOf(from), endExclusive(to)));
  }

  @GetMapping("/sales-series")
  public ApiResponse<java.util.List<AnalyticsService.DayPoint>> salesSeries(@RequestParam LocalDate from,
                                                                            @RequestParam LocalDate to) {
    return ApiResponse.ok(service.salesSeries(from, to));
  }

  @GetMapping("/top-products")
  public ApiResponse<java.util.List<AnalyticsService.TopProductRow>> topProducts(@RequestParam LocalDate from,
                                                                                  @RequestParam LocalDate to,
                                                                                  @RequestParam(required = false) Long categoryId,
                                                                                  @RequestParam(defaultValue = "10") int limit) {
    return ApiResponse.ok(service.topProducts(from, to, categoryId, limit));
  }

  @GetMapping("/coupon-usage")
  public ApiResponse<java.util.List<AnalyticsService.CouponUsageRow>> couponUsage(@RequestParam LocalDate from,
                                                                                   @RequestParam LocalDate to) {
    // Repo coupon có thể vẫn dùng LocalDateTime: để service xử lý
    return ApiResponse.ok(service.couponUsage(from, to));
  }

  @GetMapping("/low-stock")
  public ApiResponse<java.util.List<AnalyticsService.LowStockRow>> lowStock(@RequestParam(defaultValue = "5") int threshold,
                                                                             @RequestParam(defaultValue = "10") int limit) {
    return ApiResponse.ok(service.lowStock(threshold, limit));
  }

  @GetMapping("/customers-overview")
  public ApiResponse<java.util.Map<String, Object>> customersOverview(@RequestParam LocalDate from,
                                                                      @RequestParam LocalDate to) {
    return ApiResponse.ok(service.customersOverview(startOf(from), endExclusive(to)));
  }
}
