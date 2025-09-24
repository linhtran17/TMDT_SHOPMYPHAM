package com.shopmypham.config;

import com.shopmypham.modules.auth.GoogleOAuth2UserService;
import com.shopmypham.modules.auth.JwtAuthenticationFilter;
import com.shopmypham.modules.auth.JwtService;
import com.shopmypham.modules.auth.OAuth2LoginSuccessHandler;
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
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

  private final GoogleOAuth2UserService googleOAuth2UserService;
  private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
  private final UserRepository userRepo;
  private final JwtService jwtService;
  private final PasswordEncoder passwordEncoder;

  @Value("${app.frontend-url:http://localhost:4200}")
  private String frontendUrl;

  @Autowired
  public SecurityConfig(GoogleOAuth2UserService googleOAuth2UserService,
                        OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                        UserRepository userRepo,
                        JwtService jwtService,
                        PasswordEncoder passwordEncoder) {
    this.googleOAuth2UserService = googleOAuth2UserService;
    this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
    this.userRepo = userRepo;
    this.jwtService = jwtService;
    this.passwordEncoder = passwordEncoder;
  }

  @Bean
  @Transactional(readOnly = true)
  public UserDetailsService userDetailsService() {
    return email -> userRepo.findByEmailWithRolesAndPerms(email)
        .map(u -> {
          var authorities = new ArrayList<SimpleGrantedAuthority>();
          Collection<Role> roles = (u.getRoles() == null) ? new ArrayList<>() : u.getRoles();
          for (Role r : roles) {
            if (r != null && r.getName() != null) {
              String name = r.getName().trim();
              String springRole = name.startsWith("ROLE_") ? name : "ROLE_" + name;
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

  @Bean @Order(2)
  public SecurityFilterChain webChain(HttpSecurity http) throws Exception {
    http
      .csrf(AbstractHttpConfigurer::disable)
      .cors(c -> c.configurationSource(corsConfigurationSource()))
      .authorizeHttpRequests(a -> a
        .requestMatchers("/oauth2/**", "/login/oauth2/**", "/oauth2/authorization/**").permitAll()
        .anyRequest().permitAll()
      )
      .oauth2Login(oauth -> oauth
        .userInfoEndpoint(u -> u.userService(googleOAuth2UserService))
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
