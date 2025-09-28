// src/main/java/com/shopmypham/config/SecurityConfig.java
package com.shopmypham.config;

import com.shopmypham.modules.auth.GoogleOAuth2UserService;
import com.shopmypham.modules.auth.JwtAuthenticationFilter;
import com.shopmypham.modules.auth.JwtService;
import com.shopmypham.modules.auth.Role;
import com.shopmypham.modules.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.*;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

  private final GoogleOAuth2UserService googleOAuth2UserService;
  private final com.shopmypham.modules.auth.OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
  private final UserRepository userRepo;
  private final JwtService jwtService;
  private final PasswordEncoder passwordEncoder;

  @Value("${app.frontend-url:http://localhost:4200}")
  private String frontendUrl;

  @Autowired
  public SecurityConfig(GoogleOAuth2UserService googleOAuth2UserService,
                        com.shopmypham.modules.auth.OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                        UserRepository userRepo,
                        JwtService jwtService,
                        PasswordEncoder passwordEncoder) {
    this.googleOAuth2UserService = googleOAuth2UserService;
    this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
    this.userRepo = userRepo;
    this.jwtService = jwtService;
    this.passwordEncoder = passwordEncoder;
  }

  // ===== UserDetailsService: lấy user + roles/permissions theo email (ignore-case) =====
  @Bean
  @Transactional(readOnly = true)
  public UserDetailsService userDetailsService() {
    return (String emailRaw) -> {
      String email = (emailRaw == null) ? "" : emailRaw.trim();

      var u = userRepo.findByEmailWithRolesAndPermsIgnoreCase(email)
          .or(() -> userRepo.findByEmailWithRolesAndPerms(email))
          .or(() -> userRepo.findByEmailIgnoreCase(email))
          .or(() -> userRepo.findByEmail(email))
          .orElseThrow(() -> new UsernameNotFoundException("User not found"));

      var authorities = new ArrayList<SimpleGrantedAuthority>();
      var roles = (u.getRoles() == null) ? Set.<Role>of() : u.getRoles();
      for (Role r : roles) {
        if (r != null && r.getName() != null) {
          String springRole = r.getName().startsWith("ROLE_") ? r.getName() : "ROLE_" + r.getName();
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

      boolean locked = (u.getEnabled() != null && !u.getEnabled());

      // Dùng fully-qualified để tránh clash với entity User của bạn
      return org.springframework.security.core.userdetails.User
          .withUsername(u.getEmail())
          .password(u.getPassword())
          .authorities(authorities)
          .accountLocked(locked)
          .build();
    };
  }

  @Bean
  public AuthenticationProvider authenticationProvider() {
    var provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService());
    provider.setPasswordEncoder(passwordEncoder);
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
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cors = new CorsConfiguration();
    cors.setAllowedOriginPatterns(Arrays.asList(
        frontendUrl,
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:5173"
    ));
    cors.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    cors.setAllowedHeaders(Arrays.asList("*"));
    cors.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cors);
    return source;
  }

  // ===== API chain (/api/**) — JWT, stateless =====
  @Bean @Order(1)
  public SecurityFilterChain apiChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
    http
      .securityMatcher("/api/**")
      .csrf(AbstractHttpConfigurer::disable)
      .cors(c -> c.configurationSource(corsConfigurationSource()))
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authenticationProvider(authenticationProvider())
      .oauth2Login(AbstractHttpConfigurer::disable)
      .formLogin(AbstractHttpConfigurer::disable)
      .httpBasic(AbstractHttpConfigurer::disable)
      .logout(AbstractHttpConfigurer::disable)
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
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers(HttpMethod.POST,
          "/api/auth/login",
          "/api/auth/register",
          "/api/auth/logout"
        ).permitAll()
        .requestMatchers(HttpMethod.GET,
          "/api/banners/public",
          "/api/news/public/**",
          "/api/categories/tree",
          "/api/products/**",
          "/api/flash-sales/**",
          "/api/inventory/stock/**",
          "/api/coupons/public"
        ).permitAll()
        .requestMatchers(HttpMethod.POST, "/api/coupons/preview-validate").permitAll()
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated()
      );

    http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  // ===== Web chain — OAuth2/OIDC login; sau khi login sẽ redirect về FE kèm JWT =====
  @Bean @Order(2)
  public SecurityFilterChain webChain(HttpSecurity http) throws Exception {

    // OIDC inline (không tạo file mới): upsert user + gán authorities từ DB
    OidcUserService inlineOidc = new OidcUserService() {
      @Override
      public org.springframework.security.oauth2.core.oidc.user.OidcUser loadUser(
          org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest req) {
        var oidc = super.loadUser(req);
        var claims = oidc.getClaims();
        String email = (String) claims.get("email");
        String name = (String) (claims.getOrDefault("name", claims.getOrDefault("given_name", "")));
        String picture = (String) claims.get("picture");
        var authorities = googleOAuth2UserService.upsertUser(email, name, picture);
        return new DefaultOidcUser(authorities, req.getIdToken(), oidc.getUserInfo(), "email");
      }
    };

    http
      .csrf(AbstractHttpConfigurer::disable)
      .cors(c -> c.configurationSource(corsConfigurationSource()))
      .authorizeHttpRequests(a -> a
        .requestMatchers("/oauth2/**", "/login/oauth2/**", "/oauth2/authorization/**").permitAll()
        .anyRequest().permitAll()
      )
      .oauth2Login(oauth -> oauth
        .userInfoEndpoint(u -> u
          .oidcUserService(inlineOidc)           // OIDC (Google)
          .userService(googleOAuth2UserService)  // OAuth2 fallback (nếu provider không OIDC)
        )
        .successHandler(oAuth2LoginSuccessHandler)
        .failureHandler((req, res, ex) -> {
          res.setStatus(302);
          res.setHeader("Location", frontendUrl + "/login?error=google");
        })
      )
      .logout(l -> l
        .logoutUrl("/logout")
        .logoutSuccessUrl("/")
        .deleteCookies("JSESSIONID")
        .clearAuthentication(true)
        .invalidateHttpSession(true)
      );
    return http.build();
  }
}
