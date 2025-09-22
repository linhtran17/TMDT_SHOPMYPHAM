package com.shopmypham.modules.auth;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
  Optional<Role> findByName(String name);

  @EntityGraph(attributePaths = "permissions")
  @Query("select r from Role r order by r.name asc")
  List<Role> findAllWithPermissionsOrderByNameAsc();
}