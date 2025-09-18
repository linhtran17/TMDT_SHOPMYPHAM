package com.shopmypham.modules.cart;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.cart.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
  private final CartService service;
  private final com.shopmypham.modules.user.UserRepository userRepo;

  private Long currentUserId(User u){
    return userRepo.findByEmail(u.getUsername()).orElseThrow().getId();
  }

  @PostMapping("/items")
  public ApiResponse<Void> add(@AuthenticationPrincipal User u, @Valid @RequestBody CartAddItemRequest req){
    service.addItem(currentUserId(u), req);
    return ApiResponse.ok();
  }

  @PatchMapping("/items/{id}")
  public ApiResponse<Void> change(@AuthenticationPrincipal User u, @PathVariable Long id, @Valid @RequestBody CartUpdateQtyRequest body){
    service.updateQty(currentUserId(u), id, body.getQty());
    return ApiResponse.ok();
  }

  @DeleteMapping("/items/{id}")
  public ApiResponse<Void> remove(@AuthenticationPrincipal User u, @PathVariable Long id){
    service.removeItem(currentUserId(u), id);
    return ApiResponse.ok();
  }

  @GetMapping
  public ApiResponse<CartView> view(@AuthenticationPrincipal User u){
    return ApiResponse.ok(service.view(currentUserId(u)));
  }
}
