package com.shopmypham.modules.auth;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.auth.dto.AuthResponse;
import com.shopmypham.modules.auth.dto.LoginRequest;
import com.shopmypham.modules.auth.dto.RegisterRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/auth/login")
  public ApiResponse<AuthResponse> login(@RequestBody @Valid LoginRequest req) {
    return ApiResponse.ok(authService.login(req));
  }

  @PostMapping("/auth/register")
  public ApiResponse<Long> register(@RequestBody @Valid RegisterRequest req) {
    return ApiResponse.ok(authService.register(req));
  }

  @PostMapping("/auth/logout")
  public ResponseEntity<Void> apiLogout(HttpServletRequest req, HttpServletResponse res, Authentication auth) {
    new org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler().logout(req, res, auth);
    return ResponseEntity.noContent().build();
  }

}
