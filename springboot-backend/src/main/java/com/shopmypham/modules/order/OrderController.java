package com.shopmypham.modules.order;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.core.api.PageResponse;
import com.shopmypham.modules.order.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
  private final OrderService service;
  private final OrderRepository orderRepo;
  private final com.shopmypham.modules.user.UserRepository userRepo;

  private Long uid(User u){ return userRepo.findByEmail(u.getUsername()).orElseThrow().getId(); }

  @PostMapping("/checkout")
  public ApiResponse<CheckoutResponse> checkout(@AuthenticationPrincipal User u, @Valid @RequestBody CheckoutRequest req){
    return ApiResponse.ok(service.checkout(uid(u), req));
  }

  @GetMapping("/{id}")
  public ApiResponse<Order> get(@AuthenticationPrincipal User u, @PathVariable Long id){
    var od = service.get(id);
    // chỉ chủ sở hữu được xem
    Long me = uid(u);
    if (od.getUserId() != null && !od.getUserId().equals(me)) {
      throw new NotFoundException("Không tìm thấy đơn"); // tránh lộ id
    }
    return ApiResponse.ok(od);
  }

  @GetMapping("/me")
  public ApiResponse<PageResponse<Order>> myOrders(@AuthenticationPrincipal User u,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size){
    Long me = uid(u);
    Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "id"));
    var p = orderRepo.findByUserId(me, pageable);
    return ApiResponse.ok(new PageResponse<>(p.getContent(), p.getTotalElements(), p.getNumber(), p.getSize()));
  }
}
