// src/main/java/com/shopmypham/modules/flashsale/FlashSaleController.java
package com.shopmypham.modules.flashsale;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.flashsale.dto.FlashDealDto;
import com.shopmypham.modules.flashsale.dto.FlashSaleDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flash-sales")
@RequiredArgsConstructor
public class FlashSaleController {

  private final FlashSaleService service;

  // /api/flash-sales/deals?limit=8
  @GetMapping("/deals")
  public ApiResponse<List<FlashDealDto>> deals(@RequestParam(defaultValue = "8") int limit) {
    return ApiResponse.ok(service.getActiveDeals(limit));
  }

  // /api/flash-sales/{slug}
  @GetMapping("/{slug}")
  public ApiResponse<FlashSaleDto> bySlug(@PathVariable String slug) {
    return ApiResponse.ok(service.getBySlug(slug));
  }
}
