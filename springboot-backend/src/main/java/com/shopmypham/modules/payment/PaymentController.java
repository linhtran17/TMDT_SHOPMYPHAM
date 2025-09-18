package com.shopmypham.modules.payment;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.order.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

  private final OrderRepository orderRepo;
  private final PaymentTransactionRepository payRepo;

  // COD: set pending trên Order, ghi transaction initiated
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
}
