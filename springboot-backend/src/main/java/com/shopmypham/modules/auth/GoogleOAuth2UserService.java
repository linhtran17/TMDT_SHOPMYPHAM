// src/main/java/com/shopmypham/modules/auth/GoogleOAuth2UserService.java
package com.shopmypham.modules.auth;

import com.shopmypham.modules.user.User;
import com.shopmypham.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GoogleOAuth2UserService extends DefaultOAuth2UserService {

  private final UserRepository userRepo;
  private final PasswordEncoder passwordEncoder;

  /** Dùng chung cho OAuth2 & OIDC để upsert user và trả authorities */
  @Transactional
  public List<SimpleGrantedAuthority> upsertUser(String email, String name, String picture) {
    if (email == null || email.isBlank()) {
      throw new RuntimeException("OAuth account has no email");
    }

    User user = userRepo.findByEmailIgnoreCase(email).orElseGet(() -> {
      User u = new User();
      u.setEmail(email);
      u.setFullName(name != null ? name : email);
      u.setAvatarUrl(picture);
      u.setEnabled(true);
      u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // random pwd
      return u;
    });

    if (name != null && !name.equals(user.getFullName())) user.setFullName(name);
    if (picture != null && !picture.equals(user.getAvatarUrl())) user.setAvatarUrl(picture);
    if (user.getEnabled() == null) user.setEnabled(true);
    userRepo.save(user);

    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
    if (user.getRoles() != null) {
      user.getRoles().forEach(r -> {
        if (r != null && r.getName() != null) {
          String role = r.getName().startsWith("ROLE_") ? r.getName() : "ROLE_" + r.getName();
          authorities.add(new SimpleGrantedAuthority(role));
        }
        if (r != null && r.getPermissions() != null) {
          r.getPermissions().forEach(p -> {
            if (p != null && p.getName() != null) {
              authorities.add(new SimpleGrantedAuthority(p.getName().trim()));
            }
          });
        }
      });
    }
    if (authorities.stream().noneMatch(a -> a.getAuthority().startsWith("ROLE_"))) {
      authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
    }
    return authorities;
  }

  @Override
  @Transactional
  public OAuth2User loadUser(OAuth2UserRequest userRequest) {
    OAuth2User oauthUser = super.loadUser(userRequest);
    Map<String, Object> attr = new HashMap<>(oauthUser.getAttributes());

    String email = asString(attr.get("email"), null);
    String name = asString(attr.get("name"), asString(attr.get("given_name"), ""));
    String picture = asString(attr.get("picture"), null);

    var authorities = upsertUser(email, name, picture);
    return new DefaultOAuth2User(authorities, attr, "email");
  }

  private static String asString(Object v, String dft) {
    return v == null ? dft : String.valueOf(v);
  }
}
