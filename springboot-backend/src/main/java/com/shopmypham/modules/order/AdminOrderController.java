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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

  private final OrderRepository orderRepo;
  private final OrderItemRepository itemRepo;
  private final OrderStatusHistoryRepository hisRepo;
  private final InventoryMovementRepository invRepo;
  private final CouponService couponService;

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
    OrderStatus st = (status == null || status.isBlank()) ? null : OrderStatus.valueOf(status);
    LocalDateTime t1 = (from == null || from.isBlank()) ? null : LocalDateTime.parse(from);
    LocalDateTime t2 = (to == null || to.isBlank()) ? null : LocalDateTime.parse(to);
    Page<Order> p = orderRepo.search(q, st, t1, t2, pageable);
    return ApiResponse.ok(p);
  }

  @PreAuthorize("hasRole('ADMIN') or hasAuthority('order:update')")
  @PatchMapping("/{id}/status")
  public ApiResponse<Void> changeStatus(@PathVariable Long id, @RequestParam String toStatus){
    var od = orderRepo.findById(id).orElseThrow(() -> new NotFoundException("Order không tồn tại"));
    var from = od.getStatus();
    var to = OrderStatus.valueOf(toStatus);

    // Nếu hủy: hoàn kho + trả lượt coupon
    if (to == OrderStatus.cancelled && from != OrderStatus.cancelled) {
      var items = itemRepo.findByOrderIdOrderByIdAsc(id);
      for (var oi : items){
        var m = new InventoryMovement();
        m.setProductId(oi.getProductId());
        m.setVariantId(oi.getVariantId());
        m.setChangeQty(+oi.getQuantity());
        m.setReason(InventoryReason.cancel);
        m.setRefId(id);
        invRepo.save(m);
      }
      couponService.releaseUsageByOrderId(id);
    }

    // ✅ COD: đánh dấu đã thanh toán khi đã qua các mốc xác nhận/trong tiến trình giao
    if ("COD".equalsIgnoreCase(od.getPaymentMethod())
        && to != OrderStatus.cancelled
        && (to == OrderStatus.confirmed
            || to == OrderStatus.processing
            || to == OrderStatus.shipped
            || to == OrderStatus.delivered)) {
      od.setPaymentStatus(PaymentStatus.paid);
    }

    od.setStatus(to);
    orderRepo.save(od);

    var his = new OrderStatusHistory();
    his.setOrderId(id);
    his.setFromStatus(from);
    his.setToStatus(to);
    hisRepo.save(his);

    return ApiResponse.ok();
  }
}
