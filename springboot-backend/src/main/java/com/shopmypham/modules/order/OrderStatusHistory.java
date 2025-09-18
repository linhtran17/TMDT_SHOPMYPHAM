package com.shopmypham.modules.order;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name="order_status_history")
@Getter @Setter
public class OrderStatusHistory {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name="order_id", nullable=false)
  private Long orderId;

  @Enumerated(EnumType.STRING)
  @Column(name="from_status")
  private OrderStatus fromStatus;

  @Enumerated(EnumType.STRING)
  @Column(name="to_status", nullable=false)
  private OrderStatus toStatus;

  @Column(name="changed_by")
  private Long changedBy;

  private String note;

  @Column(name="created_at", insertable=false, updatable=false)
  private LocalDateTime createdAt;
}
