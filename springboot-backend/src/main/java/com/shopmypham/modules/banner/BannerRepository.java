package com.shopmypham.modules.banner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {
  List<Banner> findTop10ByActiveTrueOrderBySortOrderAscIdAsc();
  List<Banner> findAllByOrderBySortOrderAscIdAsc();
}
