// src/main/java/com/shopmypham/modules/coupon/CouponController.java
package com.shopmypham.modules.coupon;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.coupon.dto.CouponValidateRequest;
import com.shopmypham.modules.coupon.dto.CouponValidateResponse;
import com.shopmypham.modules.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors; // 👈 Thêm import này

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

  private final CouponService service;
  private final CouponRepository repo;
  private final UserRepository userRepo;

  /** Khách (guest) xem danh sách mã đang hiệu lực */
  @GetMapping("/public")
  public ApiResponse<List<Map<String, Object>>> listPublic() {
    LocalDateTime now = LocalDateTime.now();

    // 👇 Khai báo kiểu tường minh + dùng Collectors.toList() để tương thích JDK 8+
    List<Map<String, Object>> list = repo.findPublicActive(now).stream().map(c -> {
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("code", c.getCode());
      m.put("discountType", c.getDiscountType());
      m.put("discountValue", c.getDiscountValue());
      m.put("minOrderAmount", c.getMinOrderAmount());
      m.put("maxDiscountAmount", c.getMaxDiscountAmount());
      m.put("startDate", c.getStartDate());
      m.put("endDate", c.getEndDate());
      return m;
    }).collect(Collectors.toList());

    // 👇 Ép kiểu generic khi gọi ok(...) để tránh lỗi suy luận kiểu
    return ApiResponse.<List<Map<String, Object>>>ok(list);
  }

  /** Khách (guest) preview validate – không giữ chỗ, không kiểm tra đã dùng */
  @PostMapping("/preview-validate")
  public ApiResponse<CouponValidateResponse> previewValidate(@Valid @RequestBody CouponValidateRequest req) {
    return ApiResponse.ok(service.validateForUser(null, req)); // userId = null
  }

  /** Validate “thật” (yêu cầu đã đăng nhập) */
  @PostMapping("/validate")
  public ApiResponse<CouponValidateResponse> validate(Authentication auth,
                                                      @Valid @RequestBody CouponValidateRequest req) {
    if (auth == null || auth.getPrincipal() == null) {
      throw new NotFoundException("Unauthorized");
    }
    String email;
    Object principal = auth.getPrincipal();
    if (principal instanceof UserDetails uds) email = uds.getUsername();
    else email = auth.getName();

    Long userId = userRepo.findByEmail(email)
        .map(u -> u.getId())
        .orElseThrow(() -> new NotFoundException("User not found: " + email));

    return ApiResponse.ok(service.validateForUser(userId, req));
  }
}
