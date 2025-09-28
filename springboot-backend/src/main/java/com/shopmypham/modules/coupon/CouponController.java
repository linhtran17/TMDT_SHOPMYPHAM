package com.shopmypham.modules.coupon;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.core.exception.UnprocessableException;
import com.shopmypham.modules.coupon.dto.CouponValidateRequest;
import com.shopmypham.modules.coupon.dto.CouponValidateResponse;
import com.shopmypham.modules.user.UserRepository;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CouponController {

  private final CouponService service;
  private final CouponRepository repo;
  private final UserRepository userRepo;

  /* ----------------------------- PUBLIC ------------------------------ */

  @GetMapping("/coupons/public")
  public ApiResponse<List<Map<String, Object>>> listPublic() {
    LocalDateTime now = LocalDateTime.now();

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

    return ApiResponse.ok(list);
  }

  @PostMapping("/coupons/preview-validate")
  public ApiResponse<CouponValidateResponse> previewValidate(@Valid @RequestBody CouponValidateRequest req) {
    CouponValidateResponse res = service.validateForUser(null, req);
    return ApiResponse.ok(res);
  }

  /** Auth validate: hợp lệ => 200, không hợp lệ => 422 */
  @PostMapping("/coupons/validate")
  public ApiResponse<CouponValidateResponse> validate(Authentication auth,
                                                      @Valid @RequestBody CouponValidateRequest req) {
    Long userId = extractUserId(auth);
    CouponValidateResponse res = service.validateForUser(userId, req);

if (!res.isValid()) {
      String reason = (res.getReason() != null && !res.getReason().isBlank())
          ? res.getReason() : "Coupon is not applicable";
      throw new UnprocessableException(reason); // 422
    }
    return ApiResponse.ok(res);
  }

  private Long extractUserId(Authentication auth) {
    if (auth == null || auth.getPrincipal() == null) {
      throw new NotFoundException("Unauthorized");
    }
    String email;
    Object principal = auth.getPrincipal();
    if (principal instanceof UserDetails uds) email = uds.getUsername();
    else email = auth.getName();

    return userRepo.findByEmail(email)
        .map(u -> u.getId())
        .orElseThrow(() -> new NotFoundException("User not found: " + email));
  }

  /* ----------------------------- ADMIN ------------------------------- */

  @Data
  public static class CouponAdminDto {
    private Long id;
    private String code;
    private Boolean active;
    private String discountType;          // "percentage" | "fixed"
    private Double discountValue;
    private Double minOrderAmount;
    private Double maxDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer usageLimit;
    private Integer usedCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
  }

  private CouponAdminDto toDto(Coupon c) {
    var d = new CouponAdminDto();
    d.setId(c.getId());
    d.setCode(c.getCode());
    d.setActive(Boolean.TRUE.equals(c.getActive()));
    d.setDiscountType(c.getDiscountType() != null ? c.getDiscountType().name() : null);
    d.setDiscountValue(num(c.getDiscountValue()));
    d.setMinOrderAmount(num(c.getMinOrderAmount()));
    d.setMaxDiscountAmount(num(c.getMaxDiscountAmount()));
    d.setStartDate(c.getStartDate());
    d.setEndDate(c.getEndDate());
    d.setUsageLimit(c.getUsageLimit());
    d.setUsedCount(c.getUsedCount());
    d.setCreatedAt(c.getCreatedAt()); // <-- đã bỏ dấu ) thừa
    d.setUpdatedAt(c.getUpdatedAt());
    return d;
  }

  private void apply(CouponAdminDto d, Coupon c) {
    if (d.getCode() == null || d.getCode().isBlank())
      throw new BadRequestException("code is required");
    if (d.getDiscountType() == null)
      throw new BadRequestException("discountType is required");
    if (d.getDiscountValue() == null || d.getDiscountValue() <= 0)
      throw new BadRequestException("discountValue must be > 0");
    if (d.getStartDate() == null)
      throw new BadRequestException("startDate is required");
    if (d.getEndDate() != null && !d.getStartDate().isBefore(d.getEndDate()))
      throw new BadRequestException("startDate must be before endDate");

    c.setCode(d.getCode().trim());
    try {
      c.setDiscountType(DiscountType.valueOf(d.getDiscountType()));
    } catch (IllegalArgumentException e) {
      throw new BadRequestException("discountType must be 'percentage' or 'fixed'");
    }
    c.setDiscountValue(bd(d.getDiscountValue()));
    c.setMinOrderAmount(bdOrNull(d.getMinOrderAmount()));
    c.setMaxDiscountAmount(bdOrNull(d.getMaxDiscountAmount()));
    c.setStartDate(d.getStartDate());
    c.setEndDate(d.getEndDate());
    c.setUsageLimit(d.getUsageLimit());
    if (d.getActive() != null) c.setActive(d.getActive());
    if (c.getUsedCount() == null) c.setUsedCount(0);
  }

  private static Double num(BigDecimal v) { return v == null ? null : v.doubleValue(); }
  private static BigDecimal bd(Double v) { return v == null ? null : BigDecimal.valueOf(v); }
  private static BigDecimal bdOrNull(Double v) { return v == null ? null : BigDecimal.valueOf(v); }

  @GetMapping("/admin/coupons")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Map<String, Object>> adminList(
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size
  ) {
    Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size),
        Sort.by(Sort.Direction.DESC, "createdAt", "id"));

    Page<Coupon> p = repo.findAll(pageable);
    List<CouponAdminDto> content = p.getContent().stream()
        .filter(c -> q == null || q.isBlank() || c.getCode().toLowerCase().contains(q.toLowerCase()))
        .map(this::toDto)
        .toList();

    Map<String,Object> body = new LinkedHashMap<>();
    body.put("content", content);
    body.put("number", page);
    body.put("size", size);
    body.put("totalElements", p.getTotalElements());
    return ApiResponse.ok(body);
  }

  @GetMapping("/admin/coupons/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<CouponAdminDto> adminGet(@PathVariable Long id) {
    var c = repo.findById(id).orElseThrow(() -> new NotFoundException("Coupon not found: " + id));
    return ApiResponse.ok(toDto(c));
  }

  @PostMapping("/admin/coupons")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public ApiResponse<CouponAdminDto> adminCreate(@RequestBody CouponAdminDto req) {
    if (repo.existsByCodeIgnoreCase(req.getCode()))
      throw new BadRequestException("Code already exists");
    var c = new Coupon();
    apply(req, c);
    repo.save(c);
    return ApiResponse.ok(toDto(c));
  }

  @PutMapping("/admin/coupons/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public ApiResponse<CouponAdminDto> adminUpdate(@PathVariable Long id, @RequestBody CouponAdminDto req) {
    var c = repo.findById(id).orElseThrow(() -> new NotFoundException("Coupon not found: " + id));
    if (req.getCode() != null && !req.getCode().equalsIgnoreCase(c.getCode())
        && repo.existsByCodeIgnoreCase(req.getCode())) {
      throw new BadRequestException("Code already exists");
    }
    apply(req, c);
    repo.save(c);
    return ApiResponse.ok(toDto(c));
  }

  @DeleteMapping("/admin/coupons/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public ApiResponse<Void> adminDelete(@PathVariable Long id) {
    if (!repo.existsById(id)) throw new NotFoundException("Coupon not found: " + id);
    repo.deleteById(id);
    return ApiResponse.ok(null);
  }
}
