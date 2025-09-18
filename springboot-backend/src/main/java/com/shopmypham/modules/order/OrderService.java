package com.shopmypham.modules.order;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.cart.*;
import com.shopmypham.modules.cart.dto.CartView;
import com.shopmypham.modules.inventory.*;
import com.shopmypham.modules.order.dto.*;
import com.shopmypham.modules.product.*;
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
  private final ObjectMapper om = new ObjectMapper();

  private String genOrderCode(Long id){
    return "OD" + DateTimeFormatter.ofPattern("yyMMdd").format(java.time.LocalDate.now()) + "-" + id;
  }

  private Map<String,String> readJson(String json){
    try { return json==null? null : om.readValue(json, new TypeReference<Map<String,String>>(){}); }
    catch (Exception e){ return null; }
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
  items = all; // backward-compatible: không gửi thì checkout toàn giỏ
}

    // 2) re-pricing + validate tồn
    BigDecimal subtotal = BigDecimal.ZERO;
    List<OrderItem> orderLines = new ArrayList<>();

    for (var it : items){
      var p = productRepo.findById(it.getProductId()).orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại"));
      if (Boolean.TRUE.equals(p.getHasVariants()) && it.getVariantId()==null)
        throw new BadRequestException("Thiếu biến thể ở một dòng giỏ");

      BigDecimal unit;
      String sku;
      if (it.getVariantId()!=null){
        var v = variantRepo.findById(it.getVariantId()).orElseThrow(() -> new NotFoundException("Biến thể không tồn tại"));
        unit = (v.getSalePrice()!=null ? v.getSalePrice() : v.getPrice());
        sku = v.getSku();
        int avail = Optional.ofNullable(invRepo.variantQty(v.getId())).orElse(0);
        if (avail < it.getQuantity()) throw new BadRequestException("Hết hàng hoặc không đủ tồn cho SKU " + sku);
      }else{
        unit = (p.getSalePrice()!=null ? p.getSalePrice() : p.getPrice());
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
      oi.setUnitPrice(unit);
      oi.setQuantity(it.getQuantity());
      oi.setLineTotal(lineTotal);
      orderLines.add(oi);
    }

    // 3) coupon / shipping / tax (demo)
    BigDecimal discount = BigDecimal.ZERO; // TODO coupon
    BigDecimal shipping = subtotal.compareTo(new BigDecimal("300000")) >= 0 ? BigDecimal.ZERO : new BigDecimal("30000");
    BigDecimal tax = BigDecimal.ZERO;
    BigDecimal total = subtotal.add(shipping).subtract(discount).add(tax);

    // 4) create order: dùng mã tạm unique, rồi update
    var od = new Order();
    od.setOrderCode("TMP-" + java.util.UUID.randomUUID()); // ✅ unique tạm
    od.setUserId(userId);
    od.setStatus(OrderStatus.pending);
    od.setPaymentStatus(PaymentStatus.pending);
    od.setPaymentMethod((req.getPaymentMethod()==null || req.getPaymentMethod().isBlank()) ? "COD" : req.getPaymentMethod());

    od.setSubtotalAmount(subtotal);
    od.setDiscountAmount(discount);
    od.setShippingFee(shipping);
    od.setTaxAmount(tax);
    od.setTotalAmount(total);

    od.setCustomerName(req.getCustomerName());
    od.setCustomerEmail(req.getCustomerEmail());
    od.setCustomerPhone(req.getCustomerPhone());
    od.setShippingProvince(req.getShippingProvince());
    od.setShippingDistrict(req.getShippingDistrict());
    od.setShippingWard(req.getShippingWard());
    od.setShippingAddress1(req.getShippingAddress1());
    od.setShippingAddress2(req.getShippingAddress2());
    od.setNote(req.getNote());

    orderRepo.save(od); // để có id
    od.setOrderCode(genOrderCode(od.getId())); // ODyyMMdd-<id>
    orderRepo.save(od); // update mã chính thức

    // 5) persist order items
    for (var oi : orderLines){ oi.setOrderId(od.getId()); }
    orderItemRepo.saveAll(orderLines);

    // 6) Ghi sổ kho: xuất luôn
    for (var oi : orderLines){
      var m = new InventoryMovement();
      m.setProductId(oi.getProductId());
      m.setVariantId(oi.getVariantId());
      m.setChangeQty(-oi.getQuantity());
      m.setReason(InventoryReason.order);
      m.setRefId(od.getId());
      invRepo.save(m);
    }

    // 7) clear cart
    itemRepo.deleteAll(items);

    // 8) status history
    var his = new OrderStatusHistory();
    his.setOrderId(od.getId());
    his.setFromStatus(null);
    his.setToStatus(OrderStatus.pending);
    his.setNote("Order created");
    statusHisRepo.save(his);

    // response
    var res = new CheckoutResponse();
    res.setOrderId(od.getId());
    res.setOrderCode(od.getOrderCode());
    res.setTotalAmount(od.getTotalAmount());
    return res;
  }

  @Transactional(readOnly = true)
  public Order get(Long id){
    var o = orderRepo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy đơn"));
    var items = orderItemRepo.findByOrderIdOrderByIdAsc(id);
    o.setItems(items); // trả về items kèm đơn
    return o;
  }
}
