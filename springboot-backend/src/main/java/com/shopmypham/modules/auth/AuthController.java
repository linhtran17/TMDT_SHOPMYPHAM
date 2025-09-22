// src/main/java/com/shopmypham/modules/auth/AuthController.java
package com.shopmypham.modules.auth;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.auth.dto.AuthResponse;
import com.shopmypham.modules.auth.dto.CurrentUserDto;
import com.shopmypham.modules.auth.dto.LoginRequest;
import com.shopmypham.modules.auth.dto.RegisterRequest;
import com.shopmypham.modules.user.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.password.PasswordEncoder;   // 👈 THÊM
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;                                          // 👈 THÊM
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

  private final AuthService authService;
  private final UserRepository userRepo;
  private final PasswordEncoder passwordEncoder;               // 👈 THÊM

  @PostMapping("/login")
  public ApiResponse<AuthResponse> login(@RequestBody @Valid LoginRequest req) {
    return ApiResponse.ok(authService.login(req));
  }

  @PostMapping("/register")
  public ApiResponse<Long> register(@RequestBody @Valid RegisterRequest req) {
    return ApiResponse.ok(authService.register(req));
  }

  @GetMapping("/me")
  @Transactional
  public ApiResponse<CurrentUserDto> me(Authentication auth) {
    if (auth == null) throw new RuntimeException("Unauthenticated");

    Object principal = auth.getPrincipal();
    String email = null, nameFromProvider = null, avatarFromProvider = null;
    boolean oauth2 = false;

    if (principal instanceof OAuth2User) {
      oauth2 = true;
      OAuth2User oau = (OAuth2User) principal;
      email = oau.getAttribute("email");
      nameFromProvider = oau.getAttribute("name");
      avatarFromProvider = oau.getAttribute("picture");
      if (email == null || email.isBlank()) email = auth.getName();
    } else if (principal instanceof UserDetails) {
      email = ((UserDetails) principal).getUsername();
    } else {
      email = auth.getName();
    }

    if (email == null || email.isBlank()) {
      throw new RuntimeException("Cannot resolve current user email");
    }

    final String emailF = email;
    final String nameF = nameFromProvider;
    final String avatarF = avatarFromProvider;
    final boolean oauth2F = oauth2;

    com.shopmypham.modules.user.User u =
        userRepo.findByEmailWithRolesAndPerms(emailF).orElse(null);

    if (u == null) u = userRepo.findByEmail(emailF).orElse(null);

    if (u == null) {
      if (!oauth2F) throw new RuntimeException("User not found");

      // 👇 Tạo user mới cho Google và GÁN MẬT KHẨU NGẪU NHIÊN ĐÃ ENCODE
      com.shopmypham.modules.user.User nu = new com.shopmypham.modules.user.User();
      nu.setEmail(emailF);
      nu.setFullName(nameF != null ? nameF : emailF);
      nu.setAvatarUrl(avatarF);
      nu.setEnabled(true);

      String randomPwd = "oauth2:" + UUID.randomUUID();
      nu.setPassword(passwordEncoder.encode(randomPwd)); // 👈 QUAN TRỌNG

      // TODO: gán ROLE_USER mặc định nếu cần

      u = userRepo.save(nu);
    }

    Set<String> roles = (u.getRoles() == null ? Set.<com.shopmypham.modules.auth.Role>of() : u.getRoles())
        .stream().filter(Objects::nonNull)
        .map(com.shopmypham.modules.auth.Role::getName)
        .filter(Objects::nonNull).collect(Collectors.toSet());

    var authorities = new HashSet<String>(roles);
    if (u.getRoles() != null) {
      u.getRoles().forEach(r -> {
        if (r != null && r.getPermissions() != null) {
          r.getPermissions().forEach(p -> {
            if (p != null && p.getName() != null) authorities.add(p.getName().trim());
          });
        }
      });
    }

    return ApiResponse.ok(new CurrentUserDto(
        u.getId(), u.getFullName(), u.getEmail(), roles, authorities
    ));
  }
}
