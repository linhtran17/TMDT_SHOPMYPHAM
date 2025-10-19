package com.shopmypham.modules.payment;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.order.OrderRepository;
import com.shopmypham.modules.order.PaymentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.type.CheckoutResponseData;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

  private final OrderRepository orderRepo;
  private final PaymentTransactionRepository payRepo;
  private final PayOSService payOSService;

  @Value("${app.frontend-url:http://localhost:4200}")
  private String frontendUrl;

  // 1) COD
  @PostMapping("/cod/{orderId}")
  public ApiResponse<Void> cod(@PathVariable Long orderId){
    var od = orderRepo.findById(orderId).orElseThrow(() -> new NotFoundException("Order không tồn tại"));
    od.setPaymentStatus(PaymentStatus.pending);
    orderRepo.save(od);

    var tr = new PaymentTransaction();
    tr.setOrderId(orderId);
    tr.setProvider("COD");
    tr.setAmount(od.getTotalAmount());
    tr.setCurrency("VND");
    tr.setStatus(TransactionStatus.initiated);
    payRepo.save(tr);

    return ApiResponse.ok();
  }

  // 2) Tạo link thanh toán PayOS
  @PostMapping("/payos/create/{orderId}")
  public ApiResponse<CheckoutResponseData> createPayOSLink(@PathVariable Long orderId) {
    // xác nhận đơn tồn tại
    orderRepo.findById(orderId).orElseThrow(() -> new NotFoundException("Order không tồn tại"));

    final String returnUrl = frontendUrl + "/checkout/success?orderId=" + orderId;
    final String cancelUrl = frontendUrl + "/checkout/cancel?orderId=" + orderId;

    var data = payOSService.createPaymentLink(orderId, returnUrl, cancelUrl);
    return ApiResponse.ok(data);
  }

  // 3) Webhook PayOS — luôn trả 2xx
  @PostMapping("/payos/webhook")
  public ResponseEntity<String> payOSWebhook(
      @RequestBody(required = false) String rawBody,
      @RequestHeader(value = "x-payos-signature", required = false) String signature
  ) {
    try {
      log.info("PayOS webhook raw: {}", rawBody);
      payOSService.handleWebhook(rawBody, signature);
    } catch (Exception ex) {
      // Không để fail 5xx để PayOS đỡ retry dồn dập; vẫn log lỗi để theo dõi
      log.error("PayOS webhook error: {}", ex.getMessage(), ex);
    }
    return ResponseEntity.ok("OK");
  }
}
