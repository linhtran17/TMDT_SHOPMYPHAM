package com.shopmypham.modules.wishlist;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

  boolean existsByUserIdAndProductId(Long userId, Long productId);
  Optional<Wishlist> findByUserIdAndProductId(Long userId, Long productId);
  long countByUserId(Long userId);

  @EntityGraph(attributePaths = {"product"})
  Page<Wishlist> findByUserId(Long userId, Pageable pageable);

  @Query("select w.product.id from Wishlist w where w.user.id = :userId")
  List<Long> findProductIds(@Param("userId") Long userId);

  void deleteByUserIdAndProductId(Long userId, Long productId);
}
