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
  Optional<User> findByEmailIgnoreCase(String email); // thêm cho các chỗ dùng IgnoreCase
  boolean existsByEmail(String email);

  // dùng khi xóa role để chặn nếu đang được user dùng
  boolean existsByRoles_Id(Long roleId);

  // List: nạp sẵn roles (không cần permissions)
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

  // Theo email (Security): nạp sẵn roles + permissions
  @Query("""
      select distinct u
      from User u
      left join fetch u.roles r
      left join fetch r.permissions p
      where lower(u.email) = lower(:email)
      """)
  Optional<User> findByEmailWithRolesAndPerms(@Param("email") String email);

  // Tìm kiếm có filter, eager roles
  @EntityGraph(attributePaths = "roles")
  @Query("""
      select u from User u
      where (:q is null or :q = '' or
             lower(u.email) like lower(concat('%',:q,'%')) or
             (u.fullName is not null and lower(u.fullName) like lower(concat('%',:q,'%'))))
        and (:enabled is null or u.enabled = :enabled)
      """)
  Page<User> search(@Param("q") String q, @Param("enabled") Boolean enabled, Pageable pageable);
}
