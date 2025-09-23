// src/main/java/com/shopmypham/modules/cart/CartController.java
package com.shopmypham.modules.cart;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.security.AuthUtils;
import com.shopmypham.modules.cart.dto.*;
import com.shopmypham.modules.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
  private final CartService service;
  private final UserRepository userRepo;

  private Long requireUid() {
    return AuthUtils.currentUserId(userRepo)
      .orElseThrow(() -> new RuntimeException("Unauthenticated"));
  }

  @PostMapping("/items")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> add(@Valid @RequestBody CartAddItemRequest req) {
    service.addItem(requireUid(), req);
    return ApiResponse.ok();
  }

  @PatchMapping("/items/{id}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> change(@PathVariable Long id, @Valid @RequestBody CartUpdateQtyRequest body) {
    service.updateQty(requireUid(), id, body.getQty());
    return ApiResponse.ok();
  }

  @DeleteMapping("/items/{id}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> remove(@PathVariable Long id) {
    service.removeItem(requireUid(), id);
    return ApiResponse.ok();
  }

  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<CartView> view() {
    return ApiResponse.ok(service.view(requireUid()));
  }
}
