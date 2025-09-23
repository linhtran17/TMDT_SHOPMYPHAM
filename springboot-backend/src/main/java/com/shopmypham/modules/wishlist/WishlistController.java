package com.shopmypham.modules.wishlist;

import com.shopmypham.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {
  private final WishlistService service;
  private final UserRepository users;

  private Long uid(UserDetails me){
    var u = users.findByEmail(me.getUsername()).orElseThrow();
    return u.getId();
  }

  @GetMapping("/count")
  public ResponseEntity<Long> count(@AuthenticationPrincipal UserDetails me){
    return ResponseEntity.ok(service.count(uid(me)));
  }

  @GetMapping("/ids")
  public ResponseEntity<List<Long>> ids(@AuthenticationPrincipal UserDetails me){
    return ResponseEntity.ok(service.productIds(uid(me)));
  }

  @GetMapping
  public Page<WishlistItemDto> list(@AuthenticationPrincipal UserDetails me,
                                    @RequestParam(defaultValue="0") int page,
                                    @RequestParam(defaultValue="60") int size){
    var wlPage = service.list(uid(me), page, size);
    var ids = wlPage.map(w -> w.getProduct().getId()).getContent();
    var coverMap = service.coverUrls(ids);
    return wlPage.map(w -> WishlistItemDto.of(w, coverMap.get(w.getProduct().getId())));
  }

  @PostMapping("/{productId}")
  public void add(@AuthenticationPrincipal UserDetails me, @PathVariable Long productId){
    service.add(uid(me), productId);
  }

  @DeleteMapping("/{productId}")
  public void remove(@AuthenticationPrincipal UserDetails me, @PathVariable Long productId){
    service.remove(uid(me), productId);
  }
}
