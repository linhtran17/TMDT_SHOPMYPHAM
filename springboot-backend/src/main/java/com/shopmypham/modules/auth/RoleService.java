package com.shopmypham.modules.auth;

import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.auth.dto.RoleDto;
import com.shopmypham.modules.auth.dto.RoleUpsertRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {
  private final RoleRepository roleRepo;
  private final PermissionRepository permRepo;
  private final com.shopmypham.modules.user.UserRepository userRepo;

  private String normalizeRoleName(String n){
    n = (n == null ? "" : n.trim());
    if (n.isEmpty()) throw new BadRequestException("Tên vai trò không được trống");
    n = n.toUpperCase();
    return n.startsWith("ROLE_") ? n : ("ROLE_" + n);
  }

  @Transactional(readOnly = true)
  public List<RoleDto> list() {
    return roleRepo.findAllWithPermissionsOrderByNameAsc().stream()
        .map(RoleDto::of).toList();
  }

  @Transactional(readOnly = true)
  public RoleDto get(Long id) {
    var r = roleRepo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy vai trò"));
    return RoleDto.of(r);
  }

  @Transactional
  public Long create(RoleUpsertRequest req) {
    String name = normalizeRoleName(req.getName());
    roleRepo.findByName(name).ifPresent(x -> { throw new BadRequestException("Tên vai trò đã tồn tại"); });

    var role = new Role();
    role.setName(name);
    role.setPermissions(resolvePermissions(req.getPermissions()));
    return roleRepo.save(role).getId();
  }

  @Transactional
  public void update(Long id, RoleUpsertRequest req) {
    var role = roleRepo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy vai trò"));

    String name = normalizeRoleName(req.getName());
    roleRepo.findByName(name).ifPresent(exist -> {
      if (!exist.getId().equals(id)) throw new BadRequestException("Tên vai trò đã tồn tại");
    });

    role.setName(name);
    role.setPermissions(resolvePermissions(req.getPermissions()));
  }

  @Transactional
  public void delete(Long id) {
    if (!roleRepo.existsById(id)) throw new NotFoundException("Vai trò không tồn tại");
    if (userRepo.existsByRoles_Id(id)) throw new BadRequestException("Vai trò đang được sử dụng bởi người dùng, không thể xoá");
    roleRepo.deleteById(id);
  }

  private Set<Permission> resolvePermissions(Set<String> names) {
    if (names == null || names.isEmpty()) return Set.of();

    var wanted = names.stream()
        .filter(Objects::nonNull).map(String::trim)
        .filter(s -> !s.isBlank())
        .collect(Collectors.toCollection(LinkedHashSet::new));

    var found = permRepo.findByNameIn(wanted);
    var foundNames = found.stream().map(Permission::getName).collect(Collectors.toSet());

    if (found.size() != wanted.size()) {
      var missing = wanted.stream().filter(n -> !foundNames.contains(n)).toList();
      throw new BadRequestException("Quyền không hợp lệ: " + String.join(", ", missing));
    }
    return new LinkedHashSet<>(found);
  }
}
