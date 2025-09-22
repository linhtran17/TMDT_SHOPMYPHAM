package com.shopmypham.modules.order;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface OrderRepository extends JpaRepository<Order, Long> {

  @Query("""
    select o from Order o
    where (:q is null or :q='' or
           lower(o.orderCode) like lower(concat('%',:q,'%')) or
           lower(o.customerName) like lower(concat('%',:q,'%')) or
           lower(o.customerPhone) like lower(concat('%',:q,'%')))
      and (:status is null or o.status = :status)
      and (:from is null or o.createdAt >= :from)
      and (:to is null or o.createdAt < :to)
  """)
  Page<Order> search(@Param("q") String q,
                     @Param("status") OrderStatus status,
                     @Param("from") LocalDateTime from,
                     @Param("to") LocalDateTime to,
                     Pageable pageable);

  boolean existsByOrderCode(String code);

  Page<Order> findByUserId(Long userId, Pageable pageable);
}
