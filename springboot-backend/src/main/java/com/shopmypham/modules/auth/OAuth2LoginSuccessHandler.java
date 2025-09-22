package com.shopmypham.modules.auth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements org.springframework.security.web.authentication.AuthenticationSuccessHandler {

  private final JwtService jwtService;

  @Value("${app.frontend-url:http://localhost:4200}")
  private String frontendUrl;

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request,
                                      HttpServletResponse response,
                                      Authentication authentication) throws IOException, ServletException {
    Object principal = authentication.getPrincipal();
    String email;

    if (principal instanceof OAuth2User oau) {
      email = (String) oau.getAttributes().get("email");
    } else {
      email = authentication.getName();
    }

    String token = jwtService.generateToken(email);

    String redirect = UriComponentsBuilder
        .fromHttpUrl(frontendUrl)
        .path("/oauth2/callback")
        .queryParam("token", token)
        .build().toUriString();

    response.setStatus(302);
    response.setHeader("Location", redirect);
  }
}
