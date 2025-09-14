package com.shopmypham.modules.user;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/**
 * Repository cho bảng users.
 */
public interface UserRepository extends JpaRepository<User, Long> {

  /**
   * Tìm user theo email, nạp sẵn roles và permissions để tránh LazyInitializationException.
   */
  @EntityGraph(attributePaths = {"roles", "roles.permissions"})
  Optional<User> findByEmail(String email);

  /** Check email đã tồn tại. */
  boolean existsByEmail(String email);

  /**
   * Phân trang user, nạp sẵn roles và permissions.
   * Lưu ý: dùng method này thay cho findAll(pageable) mặc định nếu bạn muốn eager load các quan hệ.
   */
  @EntityGraph(attributePaths = {"roles", "roles.permissions"})
  Page<User> findAllBy(Pageable pageable);

  /**
   * Lấy chi tiết user theo id, nạp sẵn roles và permissions.
   */
  @EntityGraph(attributePaths = {"roles", "roles.permissions"})
  Optional<User> findWithRolesById(Long id);

  /**
   * Kiểm tra có user nào đang dùng roleId hay không (phục vụ xóa vai trò an toàn).
   */
  boolean existsByRoles_Id(Long roleId);
}
