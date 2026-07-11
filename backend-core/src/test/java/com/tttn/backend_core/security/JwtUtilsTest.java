package com.tttn.backend_core.security;

import static org.junit.jupiter.api.Assertions.*;

import com.tttn.backend_core.entity.Role;
import com.tttn.backend_core.entity.User;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtUtilsTest {

  private JwtUtils jwtUtils;

  @BeforeEach
  void setUp() {
    jwtUtils = new JwtUtils();
    ReflectionTestUtils.setField(
        jwtUtils, "secret", "mySuperSecretKeyForJwtWhichMustBeAtLeast32BytesLong");
    ReflectionTestUtils.setField(jwtUtils, "jwtExpirationInMs", 3600000L);
    ReflectionTestUtils.setField(jwtUtils, "jwtRefreshExpirationInMs", 604800000L);
  }

  @Test
  void testGenerateAccessTokenAndParse() {
    User user = new User();
    user.setEmail("test@tttn.com");
    user.setRole(Role.HR);

    String token = jwtUtils.generateAccessToken(user);

    assertNotNull(token);

    Claims claims = jwtUtils.parseClaims(token);
    assertEquals("test@tttn.com", claims.getSubject());
    assertEquals("ROLE_HR", claims.get("roles"));
    assertEquals("ACCESS", claims.get("type"));
  }

  @Test
  void testGenerateRefreshTokenAndParse() {
    User user = new User();
    user.setEmail("test@tttn.com");
    user.setRole(Role.HR);

    String token = jwtUtils.generateRefreshToken(user);

    assertNotNull(token);

    Claims claims = jwtUtils.parseClaims(token);
    assertEquals("test@tttn.com", claims.getSubject());
    assertEquals("REFRESH", claims.get("type"));
  }
}
