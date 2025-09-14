// src/main/java/com/shopmypham/modules/auth/AuthController.java
package com.shopmypham.modules.auth;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.auth.dto.AuthResponse;
import com.shopmypham.modules.auth.dto.CurrentUserDto;
import com.shopmypham.modules.auth.dto.LoginRequest;
import com.shopmypham.modules.auth.dto.RegisterRequest;
import com.shopmypham.modules.auth.dto.SimpleUser;   // <— thêm
import com.shopmypham.modules.user.UserRepository; // <— đổi package

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

  private final AuthService authService;
  private final UserRepository userRepo;

  @PostMapping("/login")
  public ApiResponse<AuthResponse> login(@RequestBody @Valid LoginRequest req) {
    return ApiResponse.ok(authService.login(req));
  }

  @PostMapping("/register")
  public ApiResponse<Long> register(@RequestBody @Valid RegisterRequest req) {
    return ApiResponse.ok(authService.register(req));
  }

  /** Trả user hiện tại theo JWT */
 // src/main/java/com/shopmypham/modules/auth/AuthController.java
@GetMapping("/me")
public ApiResponse<CurrentUserDto> me(Authentication auth) {
  if (auth == null || auth.getName() == null) throw new RuntimeException("Unauthenticated");
  var u = userRepo.findByEmail(auth.getName()).orElseThrow();

  var roles = (u.getRoles()==null? Set.<Role>of(): u.getRoles())
      .stream().map(Role::getName).collect(Collectors.toSet());

  var authorities = new java.util.HashSet<String>(roles);
  if (u.getRoles()!=null) {
    u.getRoles().forEach(r -> {
      if (r.getPermissions()!=null) {
        r.getPermissions().forEach(p -> {
          if (p!=null && p.getName()!=null) authorities.add(p.getName());
        });
      }
    });
  }
  return ApiResponse.ok(new CurrentUserDto(u.getId(), u.getFullName(), u.getEmail(), roles, authorities));
}

}
