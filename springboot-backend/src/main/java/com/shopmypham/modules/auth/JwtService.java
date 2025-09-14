package com.shopmypham.modules.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

@Service
public class JwtService {

  @Value("${JWT_SECRET:change-me-please-32chars-minimum-xxxxxxxxxxxxxxxx}")
  private String secret;

  @Value("${JWT_EXPIRES_MINUTES:120}")
  private long expiresMinutes;

  private Key getSigningKey() {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    // jjwt yêu cầu key >= 256bit (32 bytes). Nếu thiếu thì pad thêm 'x'
    if (bytes.length < 32) {
      byte[] padded = new byte[32];
      System.arraycopy(bytes, 0, padded, 0, Math.min(bytes.length, 32));
      for (int i = bytes.length; i < 32; i++) padded[i] = (byte) 'x';
      bytes = padded;
    }
    return Keys.hmacShaKeyFor(bytes);
  }

  /** Tạo JWT với subject = email */
  public String generateToken(String subject) {
    Date now = new Date();
    Date exp = new Date(now.getTime() + TimeUnit.MINUTES.toMillis(expiresMinutes));
    return Jwts.builder()
        .setClaims(new HashMap<>())
        .setSubject(subject)
        .setIssuedAt(now)
        .setExpiration(exp)
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  public <T> T extractClaim(String token, Function<Claims, T> resolver) {
    Claims claims = parseAllClaims(token);
    return resolver.apply(claims);
  }

  private Claims parseAllClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(getSigningKey())
        .build()
        .parseClaimsJws(token)
        .getBody();
  }

  /** Dùng khi có UserDetails */
  public boolean validateToken(String token, UserDetails user) {
    final String username = extractUsername(token);
    boolean notExpired = parseAllClaims(token).getExpiration().after(new Date());
    return username != null && username.equals(user.getUsername()) && notExpired;
  }

  /** Convenience: dùng với username thô (filter đang gọi method này) */
  public boolean isTokenValid(String token, String username) {
    try {
      String sub = extractUsername(token);
      boolean notExpired = parseAllClaims(token).getExpiration().after(new Date());
      return username != null && username.equals(sub) && notExpired;
    } catch (Exception e) {
      return false;
    }
  }
}
