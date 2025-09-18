package com.shopmypham.modules.supplier;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

  // Tìm kiếm: name / code / phone / email (không phân biệt hoa–thường)
  Page<Supplier> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCaseOrPhoneContainingIgnoreCaseOrEmailContainingIgnoreCase(
      String name, String code, String phone, String email, Pageable pageable
  );

  // Kiểm tra trùng mã (không phân biệt hoa–thường)
  boolean existsByCodeIgnoreCase(String code);
  boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
}
