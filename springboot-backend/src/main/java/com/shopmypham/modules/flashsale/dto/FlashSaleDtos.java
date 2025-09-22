package com.shopmypham.modules.flashsale.dto;

import com.shopmypham.modules.flashsale.FlashSale.DiscountType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class FlashSaleDtos {

  /* ===== PUBLIC ===== */
  @Data @Builder @NoArgsConstructor @AllArgsConstructor
  public static class FlashDealDto {
    private Long productId;
    private String name;
    private String sku;
    private String imageUrl;
    private BigDecimal basePrice;
    private BigDecimal finalPrice;
    private Long flashId;
    private String flashName;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
  }

  @Data @Builder @NoArgsConstructor @AllArgsConstructor
  public static class FlashDealItemDto {
    private Long id; // admin dùng, public có thể null
    private Long productId;
    private String name;
    private String sku;
    private String imageUrl;
    private BigDecimal basePrice;
    private BigDecimal finalPrice;
    private BigDecimal dealPrice; // null => dùng rule chung
    private Integer sortOrder;
  }

  @Data @Builder @NoArgsConstructor @AllArgsConstructor
  public static class FlashSaleDto {
    private Long id;
    private String name;
    private String slug;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Integer priority;
    private Boolean active;
    private List<FlashDealItemDto> items;
  }

  /* ===== ADMIN ===== */
  @Data @NoArgsConstructor @AllArgsConstructor
  public static class FlashSaleUpsertReq {
    private String name;
    private String slug;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private LocalDateTime startAt; // FE gửi 'YYYY-MM-DDTHH:mm' (local)
    private LocalDateTime endAt;
    private Integer priority;
    private Boolean active;
  }

  @Data @AllArgsConstructor
  public static class FlashSaleAdminListItem {
    private Long id;
    private String name;
    private String slug;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Integer priority;
    private Boolean active;
    private Long itemCount;
  }

  @Data @AllArgsConstructor
  public static class PageResp<T> {
    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int number;
    private int size;
  }
}
