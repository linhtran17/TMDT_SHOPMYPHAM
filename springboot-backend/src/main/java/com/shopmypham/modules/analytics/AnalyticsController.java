// src/main/java/com/shopmypham/modules/analytics/AnalyticsController.java
package com.shopmypham.modules.analytics;

import com.shopmypham.core.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

  private final AnalyticsService service;

  @GetMapping("/summary")
  public ApiResponse<Map<String,Object>> summary(@RequestParam LocalDate from,
                                                 @RequestParam LocalDate to) {
    LocalDateTime f = from.atStartOfDay();
    LocalDateTime t = to.plusDays(1).atStartOfDay(); // make 'to' exclusive
    return ApiResponse.ok(service.summary(f, t));
  }

  @GetMapping("/sales-series")
  public ApiResponse<List<AnalyticsService.DayPoint>> salesSeries(@RequestParam LocalDate from,
                                                                  @RequestParam LocalDate to) {
    return ApiResponse.ok(service.salesSeries(from, to));
  }

  @GetMapping("/top-products")
  public ApiResponse<List<AnalyticsService.TopProductRow>> topProducts(@RequestParam LocalDate from,
                                                                       @RequestParam LocalDate to,
                                                                       @RequestParam(required = false) Long categoryId,
                                                                       @RequestParam(defaultValue = "10") int limit) {
    return ApiResponse.ok(service.topProducts(from, to, categoryId, limit));
  }

  @GetMapping("/coupon-usage")
  public ApiResponse<List<AnalyticsService.CouponUsageRow>> couponUsage(@RequestParam LocalDate from,
                                                                        @RequestParam LocalDate to) {
    return ApiResponse.ok(service.couponUsage(from, to));
  }

  @GetMapping("/low-stock")
  public ApiResponse<List<AnalyticsService.LowStockRow>> lowStock(@RequestParam(defaultValue = "5") int threshold,
                                                                  @RequestParam(defaultValue = "10") int limit) {
    return ApiResponse.ok(service.lowStock(threshold, limit));
  }

  @GetMapping("/customers-overview")
  public ApiResponse<Map<String, Object>> customersOverview(@RequestParam LocalDate from,
                                                            @RequestParam LocalDate to) {
    LocalDateTime f = from.atStartOfDay();
    LocalDateTime t = to.plusDays(1).atStartOfDay();
    return ApiResponse.ok(service.customersOverview(f, t));
  }
}
