// src/main/java/com/shopmypham/modules/coupon/CouponService.java
package com.shopmypham.modules.coupon;

import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.modules.coupon.dto.*;
import com.shopmypham.modules.pricing.PricingService;
import com.shopmypham.modules.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

  private final CouponRepository couponRepo;
  private final CouponUsageRepository usageRepo;
  private final CouponProductRepository cpRepo;
  private final CouponCategoryRepository ccRepo;
  private final ProductRepository productRepo;
  private final PricingService pricingService;

  public CouponValidateResponse validateForUser(Long userId, CouponValidateRequest req) {
    final String code = req.getCode().trim();
    final var now = LocalDateTime.now();

    var coupon = couponRepo.findActiveNowByCode(code, now).orElse(null);
    if (coupon == null) return invalid(code, "Mã không tồn tại hoặc hết hạn");

    if (coupon.getDiscountValue() == null || coupon.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0)
      return invalid(code, "discount_value không hợp lệ");
    if (!coupon.getStartDate().isBefore(coupon.getEndDate()))
      return invalid(code, "Khoảng thời gian mã không hợp lệ");

    // limit tổng (chỉ để hiển thị thông báo; không giữ chỗ ở preview)
    if (coupon.getUsageLimit() != null && coupon.getUsedCount() != null
        && coupon.getUsedCount() >= coupon.getUsageLimit()) {
      return invalid(code, "Mã đã đạt giới hạn sử dụng");
    }

    // người dùng đã dùng chưa? — chỉ check nếu có userId (đã đăng nhập)
    if (userId != null && usageRepo.existsByCouponIdAndUserId(coupon.getId(), userId)) {
      return invalid(code, "Bạn đã dùng mã này rồi");
    }

    // Phạm vi: nếu không có record -> áp toàn shop
    Set<Long> scopeProducts = cpRepo.findByCouponId(coupon.getId())
        .stream().map(CouponProduct::getProductId).collect(Collectors.toSet());
    Set<Long> scopeCategories = ccRepo.findByCouponId(coupon.getId())
        .stream().map(CouponCategory::getCategoryId).collect(Collectors.toSet());
    boolean hasScope = !scopeProducts.isEmpty() || !scopeCategories.isEmpty();

    // Lấy map productId -> categoryId để check theo danh mục
    var productIds = req.getItems().stream().map(CouponValidateRequest.Item::getProductId).distinct().toList();
    var productCat = productRepo.findAllById(productIds).stream()
        .collect(Collectors.toMap(p -> p.getId(), p -> p.getCategoryId()));

    BigDecimal subtotalEligible = BigDecimal.ZERO;

    for (var it : req.getItems()) {
      boolean eligible = true;
      if (hasScope) {
        Long pid = it.getProductId();
        Long catId = productCat.get(pid);
        eligible = scopeProducts.contains(pid) || (catId != null && scopeCategories.contains(catId));
      }
      if (!eligible) continue;

      BigDecimal unit = pricingService.effectivePrice(it.getProductId(), it.getVariantId());
      subtotalEligible = subtotalEligible.add(unit.multiply(BigDecimal.valueOf(it.getQuantity())));
    }

    if (subtotalEligible.compareTo(BigDecimal.ZERO) <= 0)
      return invalid(code, "Không có sản phẩm nào phù hợp phạm vi của mã");

    if (coupon.getMinOrderAmount() != null
        && subtotalEligible.compareTo(coupon.getMinOrderAmount()) < 0)
      return invalid(code, "Chưa đạt giá trị tối thiểu");

    // tính discount
    BigDecimal discount;
    if (coupon.getDiscountType() == DiscountType.percentage) {
      discount = subtotalEligible.multiply(coupon.getDiscountValue()).divide(new BigDecimal("100"));
    } else {
      discount = coupon.getDiscountValue().min(subtotalEligible);
    }
    if (coupon.getMaxDiscountAmount() != null) {
      discount = discount.min(coupon.getMaxDiscountAmount());
    }
    if (discount.compareTo(BigDecimal.ZERO) <= 0)
      return invalid(code, "Số tiền giảm = 0");

    return CouponValidateResponse.builder()
        .valid(true).code(code).discountAmount(discount).build();
  }

  private CouponValidateResponse invalid(String code, String reason) {
    return CouponValidateResponse.builder().valid(false).code(code).reason(reason).build();
  }

  /** Gọi sau khi tạo Order thành công để ghi usage + tăng used_count an toàn. */
  @Transactional
  public void reserveUsageForOrder(Long userId, Long orderId, String code) {
    if (code == null || code.isBlank()) return;
    var coupon = couponRepo.findActiveNowByCode(code.trim(), LocalDateTime.now())
        .orElseThrow(() -> new BadRequestException("Mã không hợp lệ/hết hạn"));

    // đảm bảo 1 user 1 lần
    if (usageRepo.existsByCouponIdAndUserId(coupon.getId(), userId))
      throw new BadRequestException("Bạn đã dùng mã này rồi");

    // tăng used_count (atomic, tôn trọng usage_limit)
    int ok = couponRepo.reserveOne(coupon.getId());
    if (ok == 0) throw new BadRequestException("Mã đã đạt giới hạn sử dụng");

    // ghi usage
    var u = new CouponUsage();
    u.setCouponId(coupon.getId());
    u.setUserId(userId);
    u.setOrderId(orderId);
    usageRepo.save(u);
  }

  /** Gọi khi admin HUỶ đơn để trả lại lượt dùng. */
  @Transactional
  public void releaseUsageByOrderId(Long orderId) {
    var usage = usageRepo.findByOrderId(orderId).orElse(null);
    if (usage == null) return;
    couponRepo.releaseOne(usage.getCouponId());
    usageRepo.deleteById(usage.getId());
  }
}
