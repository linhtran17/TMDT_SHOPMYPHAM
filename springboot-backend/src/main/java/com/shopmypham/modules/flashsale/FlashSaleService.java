package com.shopmypham.modules.flashsale;

import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.flashsale.dto.FlashDealDto;
import com.shopmypham.modules.flashsale.dto.FlashDealItemDto;
import com.shopmypham.modules.flashsale.dto.FlashSaleDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FlashSaleService {
  private final FlashSaleRepository saleRepo;
  private final FlashSaleQueryRepository queryRepo;

  @Transactional(readOnly = true)
  public List<FlashDealDto> getActiveDeals(int limit) {
    var rows = queryRepo.findActiveDeals(PageRequest.of(0, Math.max(1, limit)));
    return rows.stream().map(r ->
      FlashDealDto.builder()
        .productId(r.getProductId())
        .name(r.getName())
        .sku(r.getSku())
        .imageUrl(r.getImageUrl())
        .basePrice(r.getBasePrice())
        .finalPrice(r.getFinalPrice())
        .flashId(r.getFlashId())
        .flashName(r.getFlashName())
        .startAt(r.getStartAt())
        .endAt(r.getEndAt())
        .build()
    ).toList();
  }

  @Transactional(readOnly = true)
  public FlashSaleDto getBySlug(String slug) {
    var sale = saleRepo.findBySlug(slug)
      .orElseThrow(() -> new NotFoundException("Không tìm thấy flash sale"));

    var items = queryRepo.findItemsBySlug(slug).stream().map(r ->
      FlashDealItemDto.builder()
        .productId(r.getProductId())
        .name(r.getName())
        .sku(r.getSku())
        .imageUrl(r.getImageUrl())
        .basePrice(r.getBasePrice())
        .finalPrice(r.getFinalPrice())
        .dealPrice(r.getDealPrice())
        .sortOrder(r.getSortOrder())
        .build()
    ).toList();

    return FlashSaleDto.builder()
      .id(sale.getId())
      .name(sale.getName())
      .slug(sale.getSlug())
      .discountType(sale.getDiscountType())
      .discountValue(sale.getDiscountValue())
      .startAt(sale.getStartAt())
      .endAt(sale.getEndAt())
      .priority(sale.getPriority())
      .active(sale.getActive())
      .items(items)
      .build();
  }
}
