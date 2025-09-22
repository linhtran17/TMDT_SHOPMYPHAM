package com.shopmypham.modules.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository cho bảng permissions.
 */
public interface PermissionRepository extends JpaRepository<Permission, Long> {

  /** Tìm theo tên quyền (ví dụ: "product:read"). */
  Optional<Permission> findByName(String name);

  /** Lấy danh sách quyền theo tập tên. */
  List<Permission> findByNameIn(Collection<String> names);
}