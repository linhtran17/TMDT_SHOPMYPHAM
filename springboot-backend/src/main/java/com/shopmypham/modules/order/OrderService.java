package com.shopmypham.modules.order;

import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.cart.*;
import com.shopmypham.modules.coupon.*;
import com.shopmypham.modules.coupon.dto.CouponValidateRequest;
import com.shopmypham.modules.coupon.dto.CouponValidateResponse;
import com.shopmypham.modules.inventory.*;
import com.shopmypham.modules.product.*;
import com.shopmypham.modules.order.dto.*;
import com.shopmypham.modules.pricing.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderService {

  private final CartRepository cartRepo;
  private final CartItemRepository itemRepo;
  private final ProductRepository productRepo;
  private final ProductVariantRepository variantRepo;

  private final OrderRepository orderRepo;
  private final OrderItemRepository orderItemRepo;
  private final OrderStatusHistoryRepository statusHisRepo;

  private final InventoryMovementRepository invRepo;

  private final CartService cartService;

  // 👇 Thêm 3 bean để áp giá + coupon
  private final PricingService pricingService;
  private final CouponService couponService;
  private final CouponRepository couponRepo;

  private String genOrderCode(Long id){
    return "OD" + DateTimeFormatter.ofPattern("yyMMdd").format(java.time.LocalDate.now()) + "-" + id;
  }

  @Transactional
  public CheckoutResponse checkout(Long userId, CheckoutRequest req){
    // 1) load cart
    var cart = cartRepo.findByUserId(userId).orElseThrow(() -> new BadRequestException("Giỏ hàng trống"));
    var all = itemRepo.findByCartIdOrderByIdAsc(cart.getId());
    if (all.isEmpty()) throw new BadRequestException("Giỏ hàng trống");

    List<CartItem> items;
    if (req.getItemIds()!=null && !req.getItemIds().isEmpty()){
      var idSet = new java.util.HashSet<>(req.getItemIds());
      items = all.stream().filter(it -> idSet.contains(it.getId())).toList();
      if (items.isEmpty()) throw new BadRequestException("Không có dòng nào được chọn");
    } else {
      items = all; // checkout toàn giỏ
    }

    // 2) re-pricing + validate tồn (DÙNG PricingService)
    BigDecimal subtotal = BigDecimal.ZERO;
    List<OrderItem> orderLines = new ArrayList<>();

    for (var it : items){
      var p = productRepo.findById(it.getProductId()).orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại"));
      if (Boolean.TRUE.equals(p.getHasVariants()) && it.getVariantId()==null)
        throw new BadRequestException("Thiếu biến thể ở một dòng giỏ");

      BigDecimal unit = pricingService.effectivePrice(it.getProductId(), it.getVariantId()); // 💡 giá hiệu lực 1 chỗ
      String sku;

      if (it.getVariantId()!=null){
        var v = variantRepo.findById(it.getVariantId()).orElseThrow(() -> new NotFoundException("Biến thể không tồn tại"));
        sku = v.getSku();
        int avail = Optional.ofNullable(invRepo.variantQty(v.getId())).orElse(0);
        if (avail < it.getQuantity()) throw new BadRequestException("Hết hàng hoặc không đủ tồn cho SKU " + sku);
      } else {
        sku = p.getSku();
        int avail = Optional.ofNullable(invRepo.productQty(p.getId())).orElse(0);
        if (avail < it.getQuantity()) throw new BadRequestException("Không đủ tồn cho sản phẩm " + p.getName());
      }

      BigDecimal lineTotal = unit.multiply(BigDecimal.valueOf(it.getQuantity()));
      subtotal = subtotal.add(lineTotal);

      var oi = new OrderItem();
      oi.setProductId(p.getId());
      oi.setVariantId(it.getVariantId());
      oi.setProductSku(sku);
      oi.setProductName(p.getName());
      oi.setOptionsSnapshot(it.getOptionsSnapshot());
      oi.setUnitPrice(unit);     // đóng băng giá hiệu lực
      oi.setQuantity(it.getQuantity());
      oi.setLineTotal(lineTotal);
      orderLines.add(oi);
    }

    // 3) phí/thuế
    BigDecimal shipping = subtotal.compareTo(new BigDecimal("300000")) >= 0 ? BigDecimal.ZERO : new BigDecimal("30000");
    BigDecimal tax = BigDecimal.ZERO;

    // 3b) COUPON: validate theo items thực tế
    BigDecimal discount = BigDecimal.ZERO;
    String couponCode = (req.getCouponCode()==null || req.getCouponCode().isBlank()) ? null : req.getCouponCode().trim();
    Long couponId = null;

    if (couponCode != null) {
      var vr = new CouponValidateRequest();
      vr.setCode(couponCode);
      var list = new ArrayList<CouponValidateRequest.Item>();
      for (var oi : orderLines) {
        var x = new CouponValidateRequest.Item();
        x.setProductId(oi.getProductId());
        x.setVariantId(oi.getVariantId());
        x.setQuantity(oi.getQuantity());
        list.add(x);
      }
      vr.setItems(list);

      CouponValidateResponse r = couponService.validateForUser(userId, vr);
      if (!r.isValid()) throw new BadRequestException("Coupon invalid: " + r.getReason());
      discount = r.getDiscountAmount();

      couponId = couponRepo.findActiveNowByCode(couponCode, java.time.LocalDateTime.now())
          .map(Coupon::getId).orElse(null);
    }

    BigDecimal total = subtotal.add(shipping).subtract(discount).add(tax);

    // 4) tạo order (mã tạm → mã chính thức)
    var od = new Order();
    od.setOrderCode("TMP-" + java.util.UUID.randomUUID()); // unique tạm
    od.setUserId(userId);
    od.setStatus(OrderStatus.pending);
    od.setPaymentStatus(PaymentStatus.pending);
    od.setPaymentMethod((req.getPaymentMethod()==null || req.getPaymentMethod().isBlank()) ? "COD" : req.getPaymentMethod());

    od.setSubtotalAmount(subtotal);
    od.setDiscountAmount(discount);
    od.setShippingFee(shipping);
    od.setTaxAmount(tax);
    od.setTotalAmount(total);

    // set coupon vào đơn (nếu có)
    od.setCouponId(couponId);
    od.setCouponCode(couponCode);

    od.setCustomerName(req.getCustomerName());
    od.setCustomerEmail(req.getCustomerEmail());
    od.setCustomerPhone(req.getCustomerPhone());
    od.setShippingProvince(req.getShippingProvince());
    od.setShippingDistrict(req.getShippingDistrict());
    od.setShippingWard(req.getShippingWard());
    od.setShippingAddress1(req.getShippingAddress1());
    od.setShippingAddress2(req.getShippingAddress2());
    od.setNote(req.getNote());

    orderRepo.save(od);                 // có id
    od.setOrderCode(genOrderCode(od.getId()));
    orderRepo.save(od);                 // update mã chính thức

    // 5) lưu items
    for (var oi : orderLines){ oi.setOrderId(od.getId()); }
    orderItemRepo.saveAll(orderLines);

    // 6) ghi sổ kho
    for (var oi : orderLines){
      var m = new InventoryMovement();
      m.setProductId(oi.getProductId());
      m.setVariantId(oi.getVariantId());
      m.setChangeQty(-oi.getQuantity());
      m.setReason(InventoryReason.order);
      m.setRefId(od.getId());
      invRepo.save(m);
    }

    // 6b) Khóa lượt dùng coupon sau khi tạo order thành công
    if (couponCode != null) {
      couponService.reserveUsageForOrder(userId, od.getId(), couponCode);
    }

    // 7) dọn cart
    itemRepo.deleteAll(items);

    // 8) history
    var his = new OrderStatusHistory();
    his.setOrderId(od.getId());
    his.setFromStatus(null);
    his.setToStatus(OrderStatus.pending);
    his.setNote("Order created");
    statusHisRepo.save(his);

    var res = new CheckoutResponse();
    res.setOrderId(od.getId());
    res.setOrderCode(od.getOrderCode());
    res.setTotalAmount(od.getTotalAmount());
    return res;
  }

  /** Map entity -> DTO (giữ nguyên phần của bạn) */
 // src/main/java/com/shopmypham/modules/order/OrderService.java
public OrderDto toDto(Order o, boolean includeItems) {
  var dto = new OrderDto();
  dto.setId(o.getId());
  dto.setOrderCode(o.getOrderCode());
  dto.setUserId(o.getUserId());
  dto.setStatus(o.getStatus());
  dto.setPaymentStatus(o.getPaymentStatus());
  dto.setPaymentMethod(o.getPaymentMethod());
  dto.setSubtotalAmount(o.getSubtotalAmount());
  dto.setDiscountAmount(o.getDiscountAmount());
  dto.setShippingFee(o.getShippingFee());
  dto.setTaxAmount(o.getTaxAmount());
  dto.setTotalAmount(o.getTotalAmount());
  dto.setCustomerName(o.getCustomerName());
  dto.setCustomerEmail(o.getCustomerEmail());
  dto.setCustomerPhone(o.getCustomerPhone());
  dto.setShippingProvince(o.getShippingProvince());
  dto.setShippingDistrict(o.getShippingDistrict());
  dto.setShippingWard(o.getShippingWard());
  dto.setShippingAddress1(o.getShippingAddress1());
  dto.setShippingAddress2(o.getShippingAddress2());
  dto.setNote(o.getNote());

  // ✅ map Instant
  dto.setCreatedAt(o.getCreatedAt());
  dto.setUpdatedAt(o.getUpdatedAt());

  if (includeItems && o.getItems()!=null) {
    var items = new ArrayList<OrderItemDto>();
    for (var it : o.getItems()) {
      var i = new OrderItemDto();
      i.setId(it.getId());
      i.setProductId(it.getProductId());
      i.setVariantId(it.getVariantId());
      i.setProductSku(it.getProductSku());
      i.setProductName(it.getProductName());
      i.setOptionsSnapshot(it.getOptionsSnapshot());
      i.setUnitPrice(it.getUnitPrice());
      i.setQuantity(it.getQuantity());
      i.setLineTotal(it.getLineTotal());
      items.add(i);
    }
    dto.setItems(items);
  }
  return dto;
}


  @Transactional(readOnly = true)
  public OrderDto get(Long id){
    var o = orderRepo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy đơn"));
    var items = orderItemRepo.findByOrderIdOrderByIdAsc(id);
    o.setItems(items); // attach items để map
    return toDto(o, true);
  }
}
