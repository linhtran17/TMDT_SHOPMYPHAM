package com.shopmypham.modules.supplier;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
@Getter @Setter
public class Supplier {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // Mã nội bộ (tuỳ chọn)
  @Column(length = 50, unique = false)
  private String code;

  @Column(nullable = false, length = 255)
  private String name;

  @Column(length = 50)
  private String phone;

  @Column(length = 150)
  private String email;

  @Column(length = 255)
  private String address;

  // Mã số thuế (tuỳ chọn)
  @Column(name = "tax_code", length = 50)
  private String taxCode;

  @Column(length = 255)
  private String note;

  @Column(nullable = false)
  private Boolean active = true;

  @Column(name = "created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;
}
