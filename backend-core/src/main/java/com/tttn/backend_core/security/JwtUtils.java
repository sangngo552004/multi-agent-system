package com.tttn.backend_core.security;

import com.tttn.backend_core.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtils {

  @Value("${jwt.secret:defaultSecretKeyWhichShouldBeVeryLongAndSecureForHS256Algorithm}")
  private String secret;

  @Value("${jwt.expiration:86400000}") // Default 24 hours
  private long jwtExpirationInMs;

  @Value("${jwt.refresh.expiration:604800000}") // Default 7 days
  private long jwtRefreshExpirationInMs;

  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes());
  }

  public Claims parseClaims(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
  }

  public String generateAccessToken(User user) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("roles", "ROLE_" + user.getRole().name());
    claims.put("type", "ACCESS");
    return createToken(claims, user.getEmail(), jwtExpirationInMs);
  }

  public String generateRefreshToken(User user) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("type", "REFRESH");
    return createToken(claims, user.getEmail(), jwtRefreshExpirationInMs);
  }

  private String createToken(Map<String, Object> claims, String subject, long expiration) {
    return Jwts.builder()
        .claims(claims)
        .subject(subject)
        .issuedAt(Date.from(Instant.now()))
        .expiration(Date.from(Instant.now().plusMillis(expiration)))
        .signWith(getSigningKey(), Jwts.SIG.HS256)
        .compact();
  }
}
