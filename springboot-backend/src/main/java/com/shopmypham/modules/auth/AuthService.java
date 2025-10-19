package com.shopmypham.modules.auth;

import com.shopmypham.modules.auth.dto.AuthResponse;
import com.shopmypham.modules.auth.dto.LoginRequest;
import com.shopmypham.modules.auth.dto.RegisterRequest;
import com.shopmypham.modules.user.User;
import com.shopmypham.modules.user.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class AuthService {
  private final AuthenticationManager authManager;
  private final UserRepository userRepo;
  private final RoleRepository roleRepo;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest req) {
    authManager.authenticate(new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
    var u = userRepo.findByEmailWithRolesAndPermsIgnoreCase(req.getEmail())
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    String token = jwtService.generateToken(u.getEmail());
    Set<String> roles = (u.getRoles() == null ? Set.<Role>of() : u.getRoles())
        .stream().map(Role::getName).collect(Collectors.toSet());
    return new AuthResponse(token, u.getEmail(), roles);
  }

  @Transactional
  public Long register(RegisterRequest req) {
    if (userRepo.existsByEmail(req.getEmail())) throw new IllegalArgumentException("Email đã tồn tại");
    var user = new User();
    user.setFullName(req.getFullName());
    user.setEmail(req.getEmail());
    user.setPassword(passwordEncoder.encode(req.getPassword()));
    user.setEnabled(true);

    var roleUser = roleRepo.findByName("ROLE_USER").orElseGet(() -> {
      var r = new Role(); r.setName("ROLE_USER"); return roleRepo.save(r);
    });
    user.setRoles(Set.of(roleUser));
    return userRepo.save(user).getId();
  }
}
