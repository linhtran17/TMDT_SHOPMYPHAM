package com.shopmypham.modules.auth;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.auth.dto.AuthResponse;
import com.shopmypham.modules.auth.dto.CurrentUserDto;
import com.shopmypham.modules.auth.dto.LoginRequest;
import com.shopmypham.modules.auth.dto.RegisterRequest;
import com.shopmypham.modules.user.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private static final Logger log = LoggerFactory.getLogger(AuthController.class);

  private final AuthService authService;
  private final UserRepository userRepo;
  private final PasswordEncoder passwordEncoder;

  public AuthController(AuthService authService,
                        UserRepository userRepo,
                        PasswordEncoder passwordEncoder) {
    this.authService = authService;
    this.userRepo = userRepo;
    this.passwordEncoder = passwordEncoder;
  }

  @PostMapping("/login")
  public ApiResponse<AuthResponse> login(@RequestBody @Valid LoginRequest req) {
    return ApiResponse.ok(authService.login(req));
  }

  @PostMapping("/register")
  public ApiResponse<Long> register(@RequestBody @Valid RegisterRequest req) {
    return ApiResponse.ok(authService.register(req));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> apiLogout(HttpServletRequest req, HttpServletResponse res, Authentication auth) {
    new org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler()
        .logout(req, res, auth);
    return ResponseEntity.noContent().build();
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

    // 👉 Quan trọng: dùng biến final cho lambda
    final String emailF = email;

    var u = userRepo.findByEmailWithRolesAndPerms(emailF)
                    .orElseGet(() -> userRepo.findByEmail(emailF).orElse(null));

    if (u == null) {
      if (!oauth2) throw new RuntimeException("User not found");
      var nu = new com.shopmypham.modules.user.User();
      nu.setEmail(emailF);
      nu.setFullName(nameFromProvider != null ? nameFromProvider : emailF);
      nu.setAvatarUrl(avatarFromProvider);
      nu.setEnabled(true);
      String randomPwd = "oauth2:" + UUID.randomUUID();
      nu.setPassword(passwordEncoder.encode(randomPwd));
      u = userRepo.save(nu);
    }

    Set<String> roles = (u.getRoles() == null ? new java.util.ArrayList<com.shopmypham.modules.auth.Role>() : u.getRoles())
        .stream()
        .filter(Objects::nonNull)
        .map(com.shopmypham.modules.auth.Role::getName)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());

    var authorities = new HashSet<String>(roles);
    if (u.getRoles() != null) {
      u.getRoles().forEach(r -> {
        if (r != null && r.getPermissions() != null) {
          r.getPermissions().forEach(p -> {
            if (p != null && p.getName() != null) {
              authorities.add(p.getName().trim());
            }
          });
        }
      });
    }

    return ApiResponse.ok(new CurrentUserDto(
        u.getId(), u.getFullName(), u.getEmail(), roles, authorities
    ));
  }
}
