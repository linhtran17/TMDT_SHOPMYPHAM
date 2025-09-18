package com.shopmypham.modules.flashsale;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FlashSaleRepository extends JpaRepository<FlashSale, Long> {
  Optional<FlashSale> findBySlug(String slug);
}
