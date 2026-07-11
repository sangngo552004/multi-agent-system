package com.tttn.backend_core.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class JwtFilterTest {

  @Mock private JwtUtils jwtUtils;

  @Mock private FilterChain filterChain;

  @Mock private Claims claims;

  @InjectMocks private JwtFilter jwtFilter;

  @BeforeEach
  void setUp() {
    SecurityContextHolder.clearContext(); // Ensure context is clean before each test
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void testDoFilterInternal_ValidAccessToken() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer valid-token");
    MockHttpServletResponse response = new MockHttpServletResponse();

    when(jwtUtils.parseClaims("valid-token")).thenReturn(claims);
    when(claims.get("type", String.class)).thenReturn("ACCESS");
    when(claims.getSubject()).thenReturn("test@tttn.com");
    when(claims.get("roles", String.class)).thenReturn("ROLE_HR");

    jwtFilter.doFilterInternal(request, response, filterChain);

    // Verify context is populated
    assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    assertEquals("test@tttn.com", SecurityContextHolder.getContext().getAuthentication().getName());
    assertEquals(
        "ROLE_HR",
        SecurityContextHolder.getContext()
            .getAuthentication()
            .getAuthorities()
            .iterator()
            .next()
            .getAuthority());

    verify(filterChain, times(1)).doFilter(request, response);
  }

  @Test
  void testDoFilterInternal_RefreshToken_ShouldNotSetContext() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer refresh-token");
    MockHttpServletResponse response = new MockHttpServletResponse();

    when(jwtUtils.parseClaims("refresh-token")).thenReturn(claims);
    when(claims.get("type", String.class)).thenReturn("REFRESH");

    jwtFilter.doFilterInternal(request, response, filterChain);

    // Verify context is empty
    assertNull(SecurityContextHolder.getContext().getAuthentication());
    verify(filterChain, times(1)).doFilter(request, response);
  }

  @Test
  void testDoFilterInternal_NoHeader() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();

    jwtFilter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    verify(jwtUtils, never()).parseClaims(anyString());
    verify(filterChain, times(1)).doFilter(request, response);
  }

  @Test
  void testDoFilterInternal_ExpiredToken() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer expired-token");
    MockHttpServletResponse response = new MockHttpServletResponse();

    when(jwtUtils.parseClaims("expired-token")).thenThrow(ExpiredJwtException.class);

    jwtFilter.doFilterInternal(request, response, filterChain);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    assertNotNull(request.getAttribute("jwtException"));
    verify(filterChain, times(1)).doFilter(request, response);
  }
}
