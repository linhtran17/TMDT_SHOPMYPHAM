package com.shopmypham.modules.user;

import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.auth.Role;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
  private final UserRepository repo;
  private final PasswordEncoder passwordEncoder;
  private final EntityManager em;

  @Transactional(readOnly = true)
  public Page<User> page(String q, Boolean enabled, int page, int size) {
    var pageable = PageRequest.of(Math.max(0,page), Math.max(1,size),
        Sort.by(Sort.Direction.DESC,"createdAt"));
    return repo.search(q, enabled, pageable);
  }

  @Transactional(readOnly = true)
  public User get(Long id){
    return repo.findWithRolesAndPermsById(id)
        .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
  }

  @Transactional
  public Long create(String fullName, String email, String rawPassword,
                     String phone, String address, String avatarUrl,
                     Boolean enabled, Set<Long> roleIds) {
    if (repo.existsByEmail(email)) throw new BadRequestException("Email đã tồn tại");
    if (rawPassword == null || rawPassword.isBlank()) throw new BadRequestException("Mật khẩu không được trống");

    var u = User.builder()
        .fullName(fullName)
        .email(email)
        .password(passwordEncoder.encode(rawPassword))
        .phone(phone).address(address).avatarUrl(avatarUrl)
        .enabled(enabled == null ? true : enabled)
        .build();

    if (roleIds != null && !roleIds.isEmpty()) {
      var roles = roleIds.stream().map(id -> em.getReference(Role.class, id)).collect(Collectors.toSet());
      u.setRoles(roles);
    }

    return repo.save(u).getId();
  }

  @Transactional
  public void update(Long id, String fullName, String email, String rawPassword,
                     String phone, String address, String avatarUrl,
                     Boolean enabled, Set<Long> roleIds) {
    var u = get(id);

    if (email != null && !email.equalsIgnoreCase(u.getEmail())) {
      if (repo.existsByEmail(email)) throw new BadRequestException("Email đã tồn tại");
      u.setEmail(email);
    }
    if (fullName != null) u.setFullName(fullName);
    if (phone != null) u.setPhone(phone);
    if (address != null) u.setAddress(address);
    if (avatarUrl != null) u.setAvatarUrl(avatarUrl);
    if (enabled != null) u.setEnabled(enabled);
    if (rawPassword != null && !rawPassword.isBlank()) {
      u.setPassword(passwordEncoder.encode(rawPassword));
    }
    if (roleIds != null) {
      var roles = roleIds.stream().map(rid -> em.getReference(Role.class, rid)).collect(Collectors.toSet());
      u.setRoles(roles);
    }
    repo.save(u);
  }

  @Transactional
  public void delete(Long id){
    if (!repo.existsById(id)) throw new NotFoundException("Không tìm thấy người dùng");
    repo.deleteById(id);
  }

  @Transactional
  public void toggleEnable(Long id, boolean enabled){
    var u = get(id);
    u.setEnabled(enabled);
    repo.save(u);
  }
}
