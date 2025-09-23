// src/main/java/com/shopmypham/modules/coupon/CouponRepository.java
package com.shopmypham.modules.coupon;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

  @Query("""
    select c from Coupon c
    where lower(c.code) = lower(:code)
      and c.active = true
      and c.startDate <= :now
      and (c.endDate is null or c.endDate >= :now)
  """)
  Optional<Coupon> findActiveNowByCode(@Param("code") String code, @Param("now") LocalDateTime now);

  @Query("""
    select c from Coupon c
    where c.active = true
      and c.startDate <= :now
      and (c.endDate is null or c.endDate >= :now)
    order by c.startDate desc
  """)
  List<Coupon> findPublicActive(@Param("now") LocalDateTime now);

  boolean existsByCodeIgnoreCase(String code);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
    update Coupon c
       set c.usedCount = c.usedCount + 1
     where c.id = :id
       and (c.usageLimit is null or c.usedCount < c.usageLimit)
  """)
  int reserveOne(@Param("id") Long id);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
    update Coupon c
       set c.usedCount = case when c.usedCount > 0 then c.usedCount - 1 else 0 end
     where c.id = :id
  """)
  int releaseOne(@Param("id") Long id);
}
