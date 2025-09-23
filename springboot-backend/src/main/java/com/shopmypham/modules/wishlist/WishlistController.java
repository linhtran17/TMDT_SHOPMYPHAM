// src/main/java/com/shopmypham/modules/wishlist/WishlistController.java
package com.shopmypham.modules.wishlist;

import com.shopmypham.core.security.AuthUtils;
import com.shopmypham.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {
  private final WishlistService service;
  private final UserRepository users;

  @GetMapping("/count")
  public ResponseEntity<Long> count() {
    var uidOpt = AuthUtils.currentUserId(users);
    if (uidOpt.isEmpty()) return ResponseEntity.ok(0L);
    return ResponseEntity.ok(service.count(uidOpt.get()));
  }

  @GetMapping("/ids")
  public ResponseEntity<List<Long>> ids() {
    var uidOpt = AuthUtils.currentUserId(users);
    if (uidOpt.isEmpty()) return ResponseEntity.ok(Collections.emptyList());
    return ResponseEntity.ok(service.productIds(uidOpt.get()));
  }

  @GetMapping
  @PreAuthorize("isAuthenticated()")
  public Page<WishlistItemDto> list(@RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "60") int size) {
    var uid = AuthUtils.currentUserId(users)
      .orElseThrow(() -> new RuntimeException("Unauthenticated"));
    var wlPage = service.list(uid, page, size);
    var ids = wlPage.map(w -> w.getProduct().getId()).getContent();
    var coverMap = service.coverUrls(ids);
    return wlPage.map(w -> WishlistItemDto.of(w, coverMap.get(w.getProduct().getId())));
  }

  @PostMapping("/{productId}")
  @PreAuthorize("isAuthenticated()")
  public void add(@PathVariable Long productId) {
    var uid = AuthUtils.currentUserId(users)
      .orElseThrow(() -> new RuntimeException("Unauthenticated"));
    service.add(uid, productId);
  }

  @DeleteMapping("/{productId}")
  @PreAuthorize("isAuthenticated()")
  public void remove(@PathVariable Long productId) {
    var uid = AuthUtils.currentUserId(users)
      .orElseThrow(() -> new RuntimeException("Unauthenticated"));
    service.remove(uid, productId);
  }
}
