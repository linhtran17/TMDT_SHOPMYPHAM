// src/main/java/com/shopmypham/modules/pricing/PricingService.java
package com.shopmypham.modules.pricing;

import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.modules.product.Product;
import com.shopmypham.modules.product.ProductRepository;
import com.shopmypham.modules.product.ProductVariant;
import com.shopmypham.modules.product.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PricingService {

  private final ProductRepository productRepo;
  private final ProductVariantRepository variantRepo;

  /** Điểm hook: nếu có FlashSaleService thì return deal price ở đây. */
  private Optional<BigDecimal> flashDealPrice(Long productId, Long variantId) {
    // TODO: tích hợp FlashSaleService khi hoàn thiện module Flash Sale
    return Optional.empty();
  }

  /**
   * Giá dùng để tính tiền/confirm đơn.
   * - Nếu có flash sale: dùng giá flash.
   * - Nếu truyền variantId: kiểm tra biến thể tồn tại & thuộc đúng product.
   * - Nếu product có biến thể nhưng thiếu variantId: báo lỗi 400.
   * - Nếu product không có biến thể: dùng salePrice ?? price.
   */
  @Transactional(readOnly = true)
  public BigDecimal effectivePrice(Long productId, Long variantId) {
    // 0) Giá flash (nếu có)
    var fs = flashDealPrice(productId, variantId);
    if (fs.isPresent()) return fs.get();

    if (variantId != null) {
      // 1) Lấy biến thể & validate thuộc đúng product
      ProductVariant v = variantRepo.findById(variantId)
          .orElseThrow(() -> new BadRequestException("Biến thể không tồn tại"));
      if (!Objects.equals(v.getProduct().getId(), productId)) {
        throw new BadRequestException("Biến thể không thuộc sản phẩm");
      }
      return v.getSalePrice() != null ? v.getSalePrice() : v.getPrice();
    }

    // 2) Không có variantId -> phải dùng cấp sản phẩm
    Product p = productRepo.findById(productId)
        .orElseThrow(() -> new BadRequestException("Sản phẩm không tồn tại"));

    if (Boolean.TRUE.equals(p.getHasVariants())) {
      // Client quên gửi variantId cho sản phẩm có biến thể
      throw new BadRequestException("Thiếu biến thể cho sản phẩm có biến thể");
    }

    return p.getSalePrice() != null ? p.getSalePrice() : p.getPrice();
  }
}
