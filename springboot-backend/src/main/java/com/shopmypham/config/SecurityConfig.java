// src/main/java/com/shopmypham/config/SecurityConfig.java
package com.shopmypham.config;

import com.shopmypham.modules.auth.GoogleOAuth2UserService;
import com.shopmypham.modules.auth.JwtAuthenticationFilter;
import com.shopmypham.modules.auth.JwtService;
import com.shopmypham.modules.auth.OAuth2LoginSuccessHandler;
import com.shopmypham.modules.auth.Role;
import com.shopmypham.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.cors.*;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

  private final GoogleOAuth2UserService googleOAuth2UserService;
  private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
  private final UserRepository userRepo;
  private final JwtService jwtService;
  private final PasswordEncoder passwordEncoder; // ✅ lấy từ PasswordConfig

  @Value("${app.frontend-url:http://localhost:4200}")
  private String frontendUrl;

  // ❗ KHÔNG khai báo @Bean passwordEncoder() ở đây để tránh trùng tên

  /** Nạp roles/permissions sớm để tránh lazy và build UserDetails chuẩn Spring Security */
  @Bean
  @Transactional(readOnly = true)
  public UserDetailsService userDetailsService() {
    return email -> userRepo.findByEmailWithRolesAndPerms(email)
        .map(u -> {
          var authorities = new ArrayList<SimpleGrantedAuthority>();
          var roles = (u.getRoles() == null ? List.<Role>of() : u.getRoles());
          for (Role r : roles) {
            if (r != null && r.getName() != null) {
              String raw = r.getName().trim();
              String springRole = raw.startsWith("ROLE_") ? raw : "ROLE_" + raw;
              authorities.add(new SimpleGrantedAuthority(springRole));
              if (r.getPermissions() != null) {
                r.getPermissions().forEach(p -> {
                  if (p != null && p.getName() != null) {
                    authorities.add(new SimpleGrantedAuthority(p.getName().trim()));
                  }
                });
              }
            }
          }
          boolean locked = Boolean.FALSE.equals(u.getEnabled());
          return User.withUsername(u.getEmail())
              .password(u.getPassword())
              .authorities(authorities)
              .accountLocked(locked)
              .build();
        })
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }

  @Bean
  public AuthenticationProvider authenticationProvider() {
    var provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService());
    provider.setPasswordEncoder(passwordEncoder); // ✅ dùng bean đã inject
    return provider;
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
    return cfg.getAuthenticationManager();
  }

  @Bean
  public JwtAuthenticationFilter jwtAuthenticationFilter(UserDetailsService uds) {
    return new JwtAuthenticationFilter(jwtService, uds);
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      // OAuth2 flow cần session cho chính lần login → IF_REQUIRED
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
      .authenticationProvider(authenticationProvider())
      .authorizeHttpRequests(auth -> auth
          .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
          // OAuth2 endpoints
          .requestMatchers("/oauth2/**", "/login/oauth2/**", "/oauth2/authorization/**").permitAll()
          // Auth APIs
          .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
          // Public APIs
          .requestMatchers(HttpMethod.GET,
              "/api/banners/public",
              "/api/news/public/**",
              "/api/categories/tree",
              "/api/products/**",
              "/api/flash-sales/**",
              "/api/inventory/stock/**"
          ).permitAll()
          // Admin
          .requestMatchers("/api/admin/**").hasRole("ADMIN")
          // Other APIs -> cần auth
          .requestMatchers("/api/**").authenticated()
          // Các tài nguyên khác (Angular, ảnh, …) -> allow
          .anyRequest().permitAll()
      )
      // Chuẩn hoá JSON cho 401/403
      .exceptionHandling(e -> e
          .authenticationEntryPoint((req, res, ex) -> {
            res.setStatus(401);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\"}");
          })
          .accessDeniedHandler((req, res, ex) -> {
            res.setStatus(403);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"success\":false,\"message\":\"Access denied\"}");
          })
      )
      // OAuth2 login: dùng custom userService + success handler để phát JWT và redirect FE
      .oauth2Login(oauth -> oauth
          .userInfoEndpoint(u -> u.userService(googleOAuth2UserService))
          .successHandler(oAuth2LoginSuccessHandler)
          .failureHandler((req, res, ex) -> {
            res.setStatus(302);
            res.setHeader("Location", frontendUrl + "/login?error=google");
          })
      );

    // JWT filter cho các request /api sau khi đã login
    http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cors = new CorsConfiguration();
    cors.setAllowedOriginPatterns(List.of(
        frontendUrl,
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:5173"
    ));
    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    cors.setAllowedHeaders(List.of("*"));
    cors.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cors);
    return source;
  }
}
