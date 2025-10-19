package com.shopmypham.modules.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.order.OrderRepository;
import com.shopmypham.modules.order.PaymentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.type.CheckoutResponseData;
import vn.payos.type.ItemData;
import vn.payos.type.PaymentData;
import vn.payos.type.Webhook;
import vn.payos.type.WebhookData;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSService {

  private final PayOS payOS;
  private final OrderRepository orderRepo;
  private final PaymentTransactionRepository txRepo;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Transactional
  public CheckoutResponseData createPaymentLink(Long orderId, String returnUrl, String cancelUrl) {
    var od = orderRepo.findById(orderId)
        .orElseThrow(() -> new NotFoundException("Order không tồn tại"));

    long orderCode = od.getId(); // dùng id đơn làm orderCode để map ngược ở webhook
    int amount = od.getTotalAmount().setScale(0, RoundingMode.HALF_UP).intValueExact();

    var item = ItemData.builder()
        .name("Thanh toan " + od.getOrderCode())
        .quantity(1).price(amount).build();

    var paymentData = PaymentData.builder()
        .orderCode(orderCode).amount(amount)
        .description("Thanh toan don " + od.getOrderCode())
        .returnUrl(returnUrl).cancelUrl(cancelUrl)
        .item(item).build();

    try {
      var res = payOS.createPaymentLink(paymentData);

      // Lưu giao dịch khởi tạo (idempotent theo paymentLinkId), có thể update nếu đã tồn tại
      txRepo.findByTransactionRef(res.getPaymentLinkId())
          .ifPresentOrElse(tx -> {
            // đảm bảo giữ status ở mức initiated nếu chưa có gì
            if (tx.getStatus() == null || tx.getStatus() == TransactionStatus.pending) {
              tx.setStatus(TransactionStatus.initiated);
              txRepo.save(tx);
            }
          }, () -> {
            var tx = new PaymentTransaction();
            tx.setOrderId(orderId);
            tx.setProvider("PAYOS");
            tx.setTransactionRef(res.getPaymentLinkId());
            tx.setAmount(od.getTotalAmount());
            tx.setCurrency("VND");
            tx.setStatus(TransactionStatus.initiated);
            txRepo.save(tx);
          });

      return res;
    } catch (Exception e) {
      log.error("createPaymentLink failed: {}", e.getMessage(), e);
      throw new RuntimeException("PayOS createPaymentLink failed: " + e.getMessage(), e);
    }
  }

  /**
   * Webhook:
   * - Parse Webhook & verify bằng SDK
   * - Idempotent: CHỈ bỏ qua khi transactionRef đã success
   * - Update bản ghi initiated/pending -> success/failed
   * - Khớp số tiền với đơn, nếu lệch thì không set paid
   */
  @Transactional
  public void handleWebhook(String rawBody, String signature) {
    if (rawBody == null || rawBody.isBlank()) {
      log.warn("Webhook rỗng - bỏ qua");
      return;
    }

    // Parse -> Webhook
    final Webhook webhook;
    try {
      var node = objectMapper.readTree(rawBody);
      webhook = objectMapper.convertValue(node, Webhook.class);
    } catch (Exception ex) {
      log.warn("Parse Webhook thất bại: {}", ex.getMessage());
      return;
    }

    // Verify chữ ký/payload
    final WebhookData data;
    try {
      data = payOS.verifyPaymentWebhookData(webhook);
    } catch (Exception verifyEx) {
      log.warn("Verify webhook thất bại: {}", verifyEx.getMessage());
      return;
    }

    // Quyết định trạng thái paid
    boolean isPaid = "00".equalsIgnoreCase(webhook.getCode());
    if (!isPaid) {
      try {
        String statusFromJson = objectMapper.readTree(rawBody)
            .path("data").path("status").asText(null);
        if ("PAID".equalsIgnoreCase(statusFromJson)) isPaid = true;
      } catch (Exception ignore) {}
    }

    // Khóa idempotency theo paymentLinkId/reference
    String ref = (data.getPaymentLinkId() != null) ? data.getPaymentLinkId() : data.getReference();
    if (ref == null || ref.isBlank()) {
      log.warn("Thiếu transaction ref trong webhook");
      return;
    }

    // Nếu đã success rồi thì bỏ qua (idempotent)
    if (txRepo.existsByTransactionRefAndStatus(ref, TransactionStatus.success)) {
      log.info("Webhook trùng (đã success) ref={}", ref);
      return;
    }

    // Xử lý nghiệp vụ
    try {
      long orderCode = data.getOrderCode();
      var od = orderRepo.findById(orderCode)
          .orElseThrow(() -> new NotFoundException("Order không tồn tại"));

      // So khớp amount với đơn
      int expected = od.getTotalAmount().setScale(0, RoundingMode.HALF_UP).intValueExact();
      if (data.getAmount() != expected) {
        log.warn("Amount mismatch. order={}, webhook={}, orderId={}", expected, data.getAmount(), od.getId());
        isPaid = false; // không cập nhật paid nếu lệch số tiền
      }

      var tx = txRepo.findByTransactionRef(ref).orElseGet(() -> {
        var t = new PaymentTransaction();
        t.setOrderId(od.getId());
        t.setProvider("PAYOS");
        t.setTransactionRef(ref);
        return t;
      });

      tx.setAmount(BigDecimal.valueOf(data.getAmount()));
      tx.setCurrency(data.getCurrency() == null ? "VND" : data.getCurrency());
      tx.setStatus(isPaid ? TransactionStatus.success : TransactionStatus.failed);
      tx.setPaidAt(isPaid ? LocalDateTime.now() : null);
      tx.setRawPayload(rawBody);
      txRepo.save(tx);

      if (isPaid) {
        od.setPaymentStatus(PaymentStatus.paid);
        orderRepo.save(od);
        log.info("Order {} set paid via webhook", od.getId());
      } else {
        log.info("Order {} webhook không paid (code/status không đạt hoặc lệch amount)", od.getId());
      }
    } catch (Exception e) {
      log.error("Xử lý webhook lỗi: {}", e.getMessage(), e);
    }
  }
}
