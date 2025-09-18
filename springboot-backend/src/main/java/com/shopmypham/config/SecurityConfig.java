// src/main/java/com/shopmypham/config/SecurityConfig.java
package com.shopmypham.config;

import com.shopmypham.modules.auth.JwtAuthenticationFilter;
import com.shopmypham.modules.auth.JwtService;
import com.shopmypham.modules.auth.Role;
import com.shopmypham.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

  private final UserRepository userRepo;
  private final JwtService jwtService;

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public UserDetailsService userDetailsService() {
    return email -> userRepo.findByEmail(email).map(u -> {
      var authorities = new ArrayList<SimpleGrantedAuthority>();
      var roles = (u.getRoles() == null ? List.<Role>of() : u.getRoles());
      for (Role r : roles) {
        if (r != null && r.getName() != null) {
          authorities.add(new SimpleGrantedAuthority(r.getName()));
          if (r.getPermissions() != null) {
            r.getPermissions().forEach(p -> {
              if (p != null && p.getName() != null) {
                authorities.add(new SimpleGrantedAuthority(p.getName()));
              }
            });
          }
        }
      }
      return org.springframework.security.core.userdetails.User
          .withUsername(u.getEmail())
          .password(u.getPassword())
          .authorities(authorities)
          .accountLocked(Boolean.FALSE.equals(u.getEnabled()))
          .build();
    }).orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }

  @Bean
  public AuthenticationProvider authenticationProvider() {
    var provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService());
    provider.setPasswordEncoder(passwordEncoder());
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
    http.csrf(csrf -> csrf.disable());
    http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
    http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    http.authenticationProvider(authenticationProvider());

    http.authorizeHttpRequests(auth -> auth
        // Preflight
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

        // Auth
        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()

        // PUBLIC (khách truy cập)
        .requestMatchers(HttpMethod.GET,
            "/api/banners/public",
            "/api/news/public/**",
            "/api/categories/tree",
            "/api/products/**",
            "/api/flash-sales/**",
            // 👇 Thêm whitelist cho tồn kho đọc:
            "/api/inventory/stock/**"
        ).permitAll()

        // Mọi API còn lại cần ĐĂNG NHẬP (quyền chi tiết do @PreAuthorize trong controller)
        .requestMatchers("/api/**").authenticated()

        // Tài nguyên khác (nếu có)
        .anyRequest().permitAll()
    );

    http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cors = new CorsConfiguration();
    cors.setAllowedOrigins(List.of("http://localhost:4200", "http://localhost:5173"));
    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    cors.setAllowedHeaders(List.of("*"));
    cors.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cors);
    return source;
  }
}
