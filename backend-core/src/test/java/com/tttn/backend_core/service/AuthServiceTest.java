package com.tttn.backend_core.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tttn.backend_core.dto.request.LoginRequest;
import com.tttn.backend_core.dto.request.RegisterRequest;
import com.tttn.backend_core.dto.response.AuthResponse;
import com.tttn.backend_core.entity.Role;
import com.tttn.backend_core.entity.User;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.UserRepository;
import com.tttn.backend_core.security.JwtUtils;
import java.time.Duration;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private JwtUtils jwtUtils;
  @Mock private StringRedisTemplate redisTemplate;
  @Mock private ObjectMapper objectMapper;
  @Mock private ValueOperations<String, String> valueOperations;

  @InjectMocks private AuthService authService;

  @BeforeEach
  void setUp() {
    lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
  }

  @Test
  void testRegister_Success() throws Exception {
    RegisterRequest request = new RegisterRequest();
    request.setEmail("test@test.com");
    request.setPassword("Password123!");

    when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
    when(objectMapper.writeValueAsString(any())).thenReturn("{}");

    authService.register(request);

    verify(valueOperations, times(1)).set(anyString(), anyString(), any(Duration.class));
    verify(userRepository, times(1)).findByEmail("test@test.com");
  }

  @Test
  void testVerifyRegistration_Success() throws Exception {
    String token = "some-uuid";
    String key = "registration_staging:" + token;

    when(valueOperations.get(key)).thenReturn("{\"email\":\"test@test.com\"}");
    RegisterRequest request = new RegisterRequest();
    request.setEmail("test@test.com");
    request.setPassword("hashed");
    when(objectMapper.readValue(anyString(), eq(RegisterRequest.class))).thenReturn(request);
    when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

    authService.verifyRegistration(token);

    verify(userRepository, times(1)).save(any(User.class));
    verify(redisTemplate, times(1)).delete(key);
  }

  @Test
  void testLogin_Success() {
    LoginRequest request = new LoginRequest();
    request.setEmail("test@test.com");
    request.setPassword("password");

    User user =
        User.builder()
            .email("test@test.com")
            .passwordHash("hash")
            .isActive(true)
            .role(Role.CANDIDATE)
            .build();

    when(redisTemplate.hasKey(anyString())).thenReturn(false);
    when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("password", "hash")).thenReturn(true);
    when(jwtUtils.generateAccessToken(any(User.class))).thenReturn("access-token");
    when(jwtUtils.generateRefreshToken(any(User.class))).thenReturn("refresh-token");

    AuthResponse response = authService.login(request);

    assertNotNull(response);
    assertEquals("access-token", response.getToken());
    assertEquals("refresh-token", response.getRefreshToken());
  }

  @Test
  void testLogin_WrongPassword_ShouldThrowException() {
    LoginRequest request = new LoginRequest();
    request.setEmail("test@test.com");
    request.setPassword("wrong");

    when(redisTemplate.hasKey(anyString())).thenReturn(false);
    when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.empty());

    when(valueOperations.increment(anyString())).thenReturn(1L);

    AppException ex = assertThrows(AppException.class, () -> authService.login(request));
    assertEquals(ErrorCode.UNAUTHENTICATED, ex.getErrorCode());
  }
}
