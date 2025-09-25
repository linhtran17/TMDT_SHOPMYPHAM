// src/main/java/com/shopmypham/modules/order/AdminOrderController.java
package com.shopmypham.modules.order;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.coupon.CouponService;
import com.shopmypham.modules.inventory.InventoryMovement;
import com.shopmypham.modules.inventory.InventoryMovementRepository;
import com.shopmypham.modules.inventory.InventoryReason;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

  private final OrderRepository orderRepo;
  private final OrderItemRepository itemRepo;
  private final OrderStatusHistoryRepository hisRepo;
  private final InventoryMovementRepository invRepo;
  private final CouponService couponService;

  // Chọn timezone để convert LocalDateTime -> Instant (cố định VN cho nhất quán)
  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private static Instant parseToInstant(String s) {
    if (s == null || s.isBlank()) return null;
    // FE gửi kiểu "yyyy-MM-ddTHH:mm" (input datetime-local)
    LocalDateTime ldt = LocalDateTime.parse(s);
    return ldt.atZone(ZONE).toInstant();
  }

  @PreAuthorize("hasRole('ADMIN') or hasAuthority('order:read')")
  @GetMapping
  public ApiResponse<Page<Order>> list(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String from,
      @RequestParam(required = false) String to,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size
  ){
    Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "id"));

    // Enum phía BE của bạn trước giờ dùng lowercase (pending/confirmed/...), FE cũng gửi lowercase => giữ nguyên.
    // Nếu enum của bạn là UPPERCASE, đổi .toUpperCase() ở đây.
    OrderStatus st = (status == null || status.isBlank()) ? null : OrderStatus.valueOf(status);

    // đổi about: LocalDateTime -> Instant (khớp repo & entity)
    Instant t1 = parseToInstant(from);
    Instant t2 = parseToInstant(to);

    Page<Order> p = orderRepo.search(q, st, t1, t2, pageable);
    return ApiResponse.ok(p);
  }

  @PreAuthorize("hasRole('ADMIN') or hasAuthority('order:update')")
  @Transactional
  @PatchMapping("/{id}/status")
  public ApiResponse<Void> changeStatus(@PathVariable Long id, @RequestParam String toStatus){
    var od  = orderRepo.findById(id).orElseThrow(() -> new NotFoundException("Order không tồn tại"));
    var from = od.getStatus();
    var to   = OrderStatus.valueOf(toStatus); // FE gửi lowercase trùng enum

    // ❗ Chặn huỷ nếu đã/đang giao
    if (to == OrderStatus.cancelled && from != OrderStatus.cancelled) {
      if (from == OrderStatus.shipped || from == OrderStatus.delivered) {
        throw new IllegalStateException("Đơn đã/đang giao — không thể huỷ. Hãy tạo phiếu hoàn hàng.");
      }

      // hoàn kho
      var items = itemRepo.findByOrderIdOrderByIdAsc(id);
      for (var oi : items){
        var m = new InventoryMovement();
        m.setProductId(oi.getProductId());
        m.setVariantId(oi.getVariantId());
        m.setChangeQty(+oi.getQuantity());
        m.setReason(InventoryReason.cancel);
        m.setRefId(id);
        m.setLocked(true); // hệ thống
        invRepo.save(m);
      }
      couponService.releaseUsageByOrderId(id);
    }

    // COD: coi như đã thanh toán khi qua các mốc giao
    if ("COD".equalsIgnoreCase(od.getPaymentMethod())
        && to != OrderStatus.cancelled
        && (to == OrderStatus.confirmed || to == OrderStatus.processing || to == OrderStatus.shipped || to == OrderStatus.delivered)) {
      od.setPaymentStatus(PaymentStatus.paid);
    }

    od.setStatus(to);
    orderRepo.save(od);

    // Khoá các dòng xuất kho theo order khi vào mốc cứng
    if (to == OrderStatus.confirmed || to == OrderStatus.processing || to == OrderStatus.shipped || to == OrderStatus.delivered) {
      invRepo.lockByOrderId(id);
    }

    var his = new OrderStatusHistory();
    his.setOrderId(id);
    his.setFromStatus(from);
    his.setToStatus(to);
    hisRepo.save(his);

    return ApiResponse.ok();
  }
}
