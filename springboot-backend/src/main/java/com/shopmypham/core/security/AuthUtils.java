// src/main/java/com/shopmypham/core/security/AuthUtils.java
package com.shopmypham.core.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Optional;

public final class AuthUtils {
  private AuthUtils() {}

  /** Trả về email đang đăng nhập (nếu có), hỗ trợ cả JWT/UserDetails lẫn Google OAuth2/OIDC. */
  public static Optional<String> currentEmail() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
      return Optional.empty();
    }
    Object p = auth.getPrincipal();
    if (p instanceof UserDetails ud) {
      return Optional.ofNullable(ud.getUsername());
    }
    if (p instanceof OidcUser oidc) {
      return Optional.ofNullable(oidc.getEmail());
    }
    if (p instanceof OAuth2User ou) {
      Object email = ou.getAttributes().get("email");
      return Optional.ofNullable(email != null ? email.toString() : null);
    }
    if (p instanceof String s && "anonymousUser".equals(s)) {
      return Optional.empty();
    }
    return Optional.empty();
  }

  /** Lấy ID người dùng qua UserRepository, từ email hiện tại. */
  public static Optional<Long> currentUserId(com.shopmypham.modules.user.UserRepository userRepo) {
    return currentEmail()
        .flatMap(email -> userRepo.findByEmail(email).map(com.shopmypham.modules.user.User::getId));
  }
}
