package com.shopmypham.modules.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);

  // dùng khi xóa role để chặn nếu đang được user dùng
  boolean existsByRoles_Id(Long roleId);

  // Trang danh sách: nạp sẵn roles để tránh N+1
  @EntityGraph(attributePaths = "roles")
  Page<User> findAllBy(Pageable pageable);

  // Chi tiết theo id: nạp sẵn roles + permissions
  @Query("""
      select distinct u
      from User u
      left join fetch u.roles r
      left join fetch r.permissions p
      where u.id = :id
      """)
  Optional<User> findWithRolesAndPermsById(@Param("id") Long id);

  // Theo email: nạp sẵn roles + permissions (dùng cho security)
  @Query("""
      select distinct u
      from User u
      left join fetch u.roles r
      left join fetch r.permissions p
      where lower(u.email) = lower(:email)
      """)
  Optional<User> findByEmailWithRolesAndPerms(@Param("email") String email);
}
