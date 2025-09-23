package com.shopmypham.modules.wishlist;

import com.shopmypham.modules.product.Product;
import com.shopmypham.modules.product.ProductImageRepository;
import com.shopmypham.modules.product.ProductRepository;
import com.shopmypham.modules.user.User;
import com.shopmypham.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WishlistService {
  private final WishlistRepository repo;
  private final UserRepository users;
  private final ProductRepository products;
  private final ProductImageRepository imageRepo;

  @Transactional
  public void add(Long userId, Long productId){
    if (repo.existsByUserIdAndProductId(userId, productId)) return;
    User u = users.findById(userId).orElseThrow();
    Product p = products.findById(productId).orElseThrow();
    repo.save(Wishlist.builder().user(u).product(p).build());
  }

  @Transactional
  public void remove(Long userId, Long productId){
    repo.deleteByUserIdAndProductId(userId, productId);
  }

  public long count(Long userId){ return repo.countByUserId(userId); }

  public Page<Wishlist> list(Long userId, int page, int size){
    return repo.findByUserId(
        userId,
        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
    );
  }

  public List<Long> productIds(Long userId){
    return repo.findProductIds(userId);
  }

  public boolean exists(Long userId, Long productId){
    return repo.existsByUserIdAndProductId(userId, productId);
  }

  /** Lấy url ảnh cover theo productId hàng loạt để tránh N+1 */
  public Map<Long,String> coverUrls(List<Long> productIds){
    if (productIds == null || productIds.isEmpty()) return Map.of();
    var rows = imageRepo.findCoverUrlsByProductIds(productIds);
    var map = new HashMap<Long,String>();
    for (Object[] r : rows){
      Long pid = ((Number) r[0]).longValue();
      String url = (String) r[1];
      map.put(pid, url);
    }
    return map;
  }
}
