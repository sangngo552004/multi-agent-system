package com.tttn.backend_core.security;

import static org.junit.jupiter.api.Assertions.*;

import com.tttn.backend_core.entity.Role;
import com.tttn.backend_core.entity.User;
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
  }

  @Test
  void testGenerateAndValidateToken() {
    User user = new User();
    user.setEmail("test@tttn.com");
    user.setRole(Role.HR);

    UserDetailsImpl userDetails = new UserDetailsImpl(user);

    String token = jwtUtils.generateToken(userDetails);

    assertNotNull(token);
    assertEquals("test@tttn.com", jwtUtils.extractUsername(token));
    assertTrue(jwtUtils.validateToken(token, userDetails));
  }
}
