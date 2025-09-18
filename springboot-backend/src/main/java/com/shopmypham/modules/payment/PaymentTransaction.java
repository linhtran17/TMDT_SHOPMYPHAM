package com.shopmypham.modules.payment;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="payment_transactions")
@Getter @Setter
public class PaymentTransaction {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name="order_id", nullable=false)
  private Long orderId;

  private String provider;

  @Column(name="transaction_ref", unique = true)
  private String transactionRef;

  @Column(precision=19, scale=2, nullable=false)
  private BigDecimal amount;

  @Column(name="currency", length=10, nullable=false)
  private String currency = "VND";

  @Enumerated(EnumType.STRING)
  @Column(name="status", nullable=false)
  private TransactionStatus status = TransactionStatus.initiated;

  @Column(name="paid_at")
  private LocalDateTime paidAt;

  @Column(name="raw_payload", columnDefinition = "json")
  private String rawPayload;

  @Column(name="created_at", insertable=false, updatable=false)
  private LocalDateTime createdAt;
}
