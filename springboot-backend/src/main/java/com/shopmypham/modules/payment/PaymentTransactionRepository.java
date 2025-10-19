package com.shopmypham.modules.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

  boolean existsByTransactionRef(String transactionRef);

  Optional<PaymentTransaction> findByTransactionRef(String transactionRef);

  // Dùng cho idempotency đúng nghĩa: chỉ skip khi đã xử lý success trước đó
  boolean existsByTransactionRefAndStatus(String transactionRef, TransactionStatus status);
}
