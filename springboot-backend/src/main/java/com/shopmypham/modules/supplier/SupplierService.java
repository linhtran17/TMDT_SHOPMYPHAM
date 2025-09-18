package com.shopmypham.modules.supplier;

import com.shopmypham.core.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** DTO page đơn giản trả về cho FE */
record PageDto<T>(List<T> items, long total, int page, int size) {}

@Service
@RequiredArgsConstructor
public class SupplierService {
  private final SupplierRepository repo;

  @Transactional(readOnly = true)
  public PageDto<Supplier> search(String q, int page, int size) {
    Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size),
        Sort.by(Sort.Direction.DESC, "id"));

    Page<Supplier> p = (q == null || q.isBlank())
        ? repo.findAll(pageable)
        : repo.findByNameContainingIgnoreCaseOrPhoneContainingIgnoreCaseOrEmailContainingIgnoreCase(
            q.trim(), q.trim(), q.trim(), pageable);

    return new PageDto<>(p.getContent(), p.getTotalElements(), page, size);
  }

  @Transactional(readOnly = true)
  public Supplier get(Long id){
    return repo.findById(id).orElseThrow(() -> new NotFoundException("Nhà cung cấp không tồn tại"));
  }

  @Transactional
  public Long create(Supplier body){
    Supplier s = new Supplier();
    s.setCode(nullIfBlank(body.getCode()));
    s.setName(reqNonBlank(body.getName(), "Tên không được trống"));
    s.setPhone(nullIfBlank(body.getPhone()));
    s.setEmail(nullIfBlank(body.getEmail()));
    s.setAddress(nullIfBlank(body.getAddress()));
    s.setTaxCode(nullIfBlank(body.getTaxCode()));
    s.setNote(nullIfBlank(body.getNote()));
    s.setActive(body.getActive() == null || body.getActive());
    repo.save(s);
    return s.getId();
  }

  @Transactional
  public void update(Long id, Supplier body){
    Supplier s = get(id);
    if (body.getName() != null) {
      if (body.getName().isBlank()) throw new IllegalArgumentException("Tên không được trống");
      s.setName(body.getName().trim());
    }
    if (body.getCode()    != null) s.setCode   (nullIfBlank(body.getCode()));
    if (body.getPhone()   != null) s.setPhone  (nullIfBlank(body.getPhone()));
    if (body.getEmail()   != null) s.setEmail  (nullIfBlank(body.getEmail()));
    if (body.getAddress() != null) s.setAddress(nullIfBlank(body.getAddress()));
    if (body.getTaxCode() != null) s.setTaxCode(nullIfBlank(body.getTaxCode()));
    if (body.getNote()    != null) s.setNote   (nullIfBlank(body.getNote()));
    if (body.getActive()  != null) s.setActive (body.getActive());
  }

  @Transactional
  public void delete(Long id){ repo.deleteById(id); }

  // helpers
  private static String nullIfBlank(String s){ return (s==null || s.isBlank()) ? null : s.trim(); }
  private static String reqNonBlank(String s, String msg){
    if (s==null || s.isBlank()) throw new IllegalArgumentException(msg);
    return s.trim();
  }
}
