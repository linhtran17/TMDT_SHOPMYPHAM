// src/main/java/com/shopmypham/modules/order/OrderController.java
package com.shopmypham.modules.order;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.api.PageResponse;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.order.dto.CheckoutRequest;
import com.shopmypham.modules.order.dto.CheckoutResponse;
import com.shopmypham.modules.order.dto.OrderDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

  private final OrderService service;
  private final OrderRepository orderRepo;
  private final com.shopmypham.modules.user.UserRepository userRepo;

  /** Lấy userId hiện tại từ Authentication (hỗ trợ cả OAuth2 và JWT) */
  private Long currentUserId(Authentication auth) {
    if (auth == null) throw new RuntimeException("Unauthenticated");

    String email = null;
    Object principal = auth.getPrincipal();

    if (principal instanceof OAuth2User oau) {
      email = oau.getAttribute("email");                 // Google OAuth2
      if (email == null || email.isBlank()) email = auth.getName();
    } else if (principal instanceof UserDetails uds) {
      email = uds.getUsername();                         // JWT / form login
    } else {
      email = auth.getName();                            // fallback chung
    }

    if (email == null || email.isBlank()) {
      throw new RuntimeException("Cannot resolve current user email");
    }

    // Chốt lại thành biến final để dùng trong Optional lambda (tránh lỗi effectively final)
    final String em = email;

    return userRepo.findByEmail(em)
        .map(u -> u.getId())
        .orElseThrow(() -> new NotFoundException("User not found: " + em));
  }

  @PostMapping("/checkout")
  public ApiResponse<CheckoutResponse> checkout(Authentication auth,
                                                @Valid @RequestBody CheckoutRequest req) {
    return ApiResponse.ok(service.checkout(currentUserId(auth), req));
  }

  @GetMapping("/{id}")
  public ApiResponse<OrderDto> get(Authentication auth, @PathVariable Long id) {
    final OrderDto od = service.get(id); // trả DTO
    final Long me = currentUserId(auth);
    if (od.getUserId() != null && !od.getUserId().equals(me)) {
      // ẩn sự tồn tại của đơn hàng không thuộc về mình
      throw new NotFoundException("Không tìm thấy đơn");
    }
    return ApiResponse.ok(od);
  }

  @GetMapping("/me")
  public ApiResponse<PageResponse<OrderDto>> myOrders(Authentication auth,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
    final Long me = currentUserId(auth);
    final Pageable pageable = PageRequest.of(
        Math.max(0, page),
        Math.max(1, size),
        Sort.by(Sort.Direction.DESC, "id")
    );

    final Page<Order> p = orderRepo.findByUserId(me, pageable);

    // Map sang DTO không dùng lambda để tránh vấn đề với biến cục bộ
    final List<OrderDto> items = new ArrayList<>(p.getNumberOfElements());
    for (Order o : p.getContent()) {
      items.add(service.toDto(o, false));
    }

    return ApiResponse.ok(new PageResponse<>(
        items, p.getTotalElements(), p.getNumber(), p.getSize()
    ));
  }
}
