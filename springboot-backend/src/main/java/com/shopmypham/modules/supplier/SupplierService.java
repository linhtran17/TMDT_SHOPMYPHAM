package com.shopmypham.modules.supplier;

import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

/** DTO phân trang đơn giản trả về cho FE */
record PageDto<T>(List<T> items, long total, int page, int size) {}

@Service
@RequiredArgsConstructor
public class SupplierService {
  private final SupplierRepository repo;

  // ====== SEARCH ======
  @Transactional(readOnly = true)
  public PageDto<Supplier> search(String q, int page, int size) {
    Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size),
        Sort.by(Sort.Direction.DESC, "id"));

    Page<Supplier> p;
    if (q == null || q.isBlank()) {
      p = repo.findAll(pageable);
    } else {
      String kw = q.trim();
      p = repo.findByNameContainingIgnoreCaseOrCodeContainingIgnoreCaseOrPhoneContainingIgnoreCaseOrEmailContainingIgnoreCase(
          kw, kw, kw, kw, pageable);
    }
    return new PageDto<>(p.getContent(), p.getTotalElements(), page, size);
  }

  @Transactional(readOnly = true)
  public Supplier get(Long id) {
    return repo.findById(id).orElseThrow(() -> new NotFoundException("Nhà cung cấp không tồn tại"));
  }

  // ====== CREATE / UPDATE / DELETE ======
  @Transactional
  public Long create(Supplier body) {
    // Chuẩn hoá input
    String name    = reqNonBlank(body.getName(), "Tên nhà cung cấp không được để trống");
    String code    = normalizeCode(nullIfBlank(body.getCode()));      // có thể null
    String phone   = reqNonBlank(body.getPhone(), "Số điện thoại là bắt buộc");
    String address = reqNonBlank(body.getAddress(), "Địa chỉ là bắt buộc");
    String email   = nullIfBlank(body.getEmail());
    String taxCode = nullIfBlank(body.getTaxCode());
    String note    = nullIfBlank(body.getNote());
    Boolean active = (body.getActive() == null) ? Boolean.TRUE : body.getActive();

    // Validate độ dài & định dạng
    validateLengths(name, code, phone, email, address, taxCode, note);
    if (email != null) validateEmail(email);
    validatePhone(phone);

    // Duy nhất code (nếu có), không phân biệt hoa–thường
    if (code != null && repo.existsByCodeIgnoreCase(code)) {
      throw new BadRequestException("Mã nhà cung cấp đã tồn tại (không phân biệt hoa–thường): " + code);
    }

    Supplier s = new Supplier();
    s.setName(name);
    s.setCode(code);
    s.setPhone(phone);
    s.setAddress(address);
    s.setEmail(email);
    s.setTaxCode(taxCode);
    s.setNote(note);
    s.setActive(active);

    repo.save(s);
    return s.getId();
  }

  @Transactional
  public void update(Long id, Supplier body) {
    Supplier s = get(id);

    // name
    if (body.getName() != null) {
      String name = body.getName().trim();
      if (name.isEmpty()) throw new BadRequestException("Tên nhà cung cấp không được để trống");
      if (name.length() > 255) throw new BadRequestException("Tên quá dài (tối đa 255 ký tự)");
      s.setName(name);
    }

    // code (tuỳ chọn – unique ignore-case nếu có)
    if (body.getCode() != null) {
      String code = normalizeCode(nullIfBlank(body.getCode()));
      if (code != null) {
        if (code.length() > 50) throw new BadRequestException("Mã quá dài (tối đa 50 ký tự)");
        if (repo.existsByCodeIgnoreCaseAndIdNot(code, id)) {
          throw new BadRequestException("Mã nhà cung cấp đã tồn tại (không phân biệt hoa–thường): " + code);
        }
      }
      s.setCode(code);
    }

    // phone (bắt buộc nếu cung cấp trong request)
    if (body.getPhone() != null) {
      String phone = body.getPhone().trim();
      if (phone.isEmpty()) throw new BadRequestException("Số điện thoại là bắt buộc");
      validatePhone(phone);
      if (phone.length() > 50) throw new BadRequestException("SĐT quá dài (tối đa 50 ký tự)");
      s.setPhone(phone);
    }

    // address (bắt buộc nếu cung cấp trong request)
    if (body.getAddress() != null) {
      String address = body.getAddress().trim();
      if (address.isEmpty()) throw new BadRequestException("Địa chỉ là bắt buộc");
      if (address.length() > 255) throw new BadRequestException("Địa chỉ quá dài (tối đa 255 ký tự)");
      s.setAddress(address);
    }

    // email (tuỳ chọn – nếu có thì đúng định dạng & ≤150)
    if (body.getEmail() != null) {
      String email = nullIfBlank(body.getEmail());
      if (email != null) {
        if (email.length() > 150) throw new BadRequestException("Email quá dài (tối đa 150 ký tự)");
        validateEmail(email);
      }
      s.setEmail(email);
    }

    // taxCode
    if (body.getTaxCode() != null) {
      String taxCode = nullIfBlank(body.getTaxCode());
      if (taxCode != null && taxCode.length() > 50)
        throw new BadRequestException("Mã số thuế quá dài (tối đa 50 ký tự)");
      s.setTaxCode(taxCode);
    }

    // note
    if (body.getNote() != null) {
      String note = nullIfBlank(body.getNote());
      if (note != null && note.length() > 255)
        throw new BadRequestException("Ghi chú quá dài (tối đa 255 ký tự)");
      s.setNote(note);
    }

    // active
    if (body.getActive() != null) {
      s.setActive(body.getActive());
    }
  }

  @Transactional
  public void delete(Long id) {
    // Tuỳ chính sách: kiểm tra ràng buộc (đơn hàng, phiếu nhập…) trước khi xoá
    repo.deleteById(id);
  }

  // ====== HELPERS ======
  private static String nullIfBlank(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }

  private static String reqNonBlank(String s, String msg) {
    if (s == null || s.isBlank()) throw new BadRequestException(msg);
    return s.trim();
  }

  // Chuẩn hoá code: upper-case, bỏ khoảng trắng thừa, chỉ giữ A–Z / 0–9 / - / _
  private static String normalizeCode(String code) {
    if (code == null) return null;
    String c = code.trim().toUpperCase().replaceAll("\\s+", "-");
    // Chỉ cho phép A-Z 0-9 - _
    if (!c.matches("^[A-Z0-9\\-_]*$")) {
      throw new BadRequestException("Mã chỉ cho phép chữ, số, -, _");
    }
    if (c.length() > 50) c = c.substring(0, 50);
    return c;
  }

  private static void validateLengths(String name, String code, String phone, String email,
                                      String address, String taxCode, String note) {
    if (name.length() > 255) throw new BadRequestException("Tên quá dài (tối đa 255 ký tự)");
    if (code != null && code.length() > 50) throw new BadRequestException("Mã quá dài (tối đa 50 ký tự)");
    if (phone.length() > 50) throw new BadRequestException("SĐT quá dài (tối đa 50 ký tự)");
    if (email != null && email.length() > 150) throw new BadRequestException("Email quá dài (tối đa 150 ký tự)");
    if (address.length() > 255) throw new BadRequestException("Địa chỉ quá dài (tối đa 255 ký tự)");
    if (taxCode != null && taxCode.length() > 50) throw new BadRequestException("Mã số thuế quá dài (tốiđa 50 ký tự)");
    if (note != null && note.length() > 255) throw new BadRequestException("Ghi chú quá dài (tối đa 255 ký tự)");
  }

  private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9+\\-\\s()]{6,50}$");
  private static void validatePhone(String phone) {
    if (!PHONE_PATTERN.matcher(phone).matches()) {
      throw new BadRequestException("SĐT không hợp lệ. Chỉ cho phép số, khoảng trắng, +, -, ().");
    }
  }

  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  private static void validateEmail(String email) {
    if (!EMAIL_PATTERN.matcher(email).matches()) {
      throw new BadRequestException("Email không hợp lệ.");
    }
  }
}
