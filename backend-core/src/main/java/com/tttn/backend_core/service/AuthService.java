package com.tttn.backend_core.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tttn.backend_core.dto.request.LoginRequest;
import com.tttn.backend_core.dto.request.RegisterRequest;
import com.tttn.backend_core.dto.response.AuthResponse;
import com.tttn.backend_core.entity.User;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.UserRepository;
import com.tttn.backend_core.security.JwtUtils;
import java.time.Duration;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtils jwtUtils;
  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;
  private final MailService mailService;

  private static final int MAX_FAILED_ATTEMPTS = 5;
  private static final long LOCKOUT_DURATION_MINUTES = 15;

  private static final long STAGING_TTL_MINUTES = 15;

  public AuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      JwtUtils jwtUtils,
      StringRedisTemplate redisTemplate,
      ObjectMapper objectMapper,
      MailService mailService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtils = jwtUtils;
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
    this.mailService = mailService;
  }

  public void register(RegisterRequest request) {
    // 1. Generate Token and Save to Staging Redis
    String token = UUID.randomUUID().toString();
    String stagingKey = "registration_staging:" + token;

    try {
      // Encode password before saving to Redis
      request.setPassword(passwordEncoder.encode(request.getPassword()));
      String json = objectMapper.writeValueAsString(request);
      redisTemplate.opsForValue().set(stagingKey, json, Duration.ofMinutes(STAGING_TTL_MINUTES));
    } catch (JsonProcessingException e) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    // 2. Silent Routing
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
      mailService.sendEmailExistsNotification(request.getEmail());
    } else {
      mailService.sendVerificationEmail(request.getEmail(), token);
    }
  }

  @Transactional
  public void verifyRegistration(String token) {
    String stagingKey = "registration_staging:" + token;
    String json = redisTemplate.opsForValue().get(stagingKey);

    if (json == null) {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    try {
      RegisterRequest request = objectMapper.readValue(json, RegisterRequest.class);

      // Double check if someone registered it
      if (userRepository.findByEmail(request.getEmail()).isPresent()) {
        throw new AppException(ErrorCode.USER_EXISTED);
      }

      User user =
          User.builder()
              .email(request.getEmail())
              .passwordHash(request.getPassword()) // Already encoded
              .fullName(request.getFullName())
              .role(request.getRole())
              .isActive(true)
              .build();

      userRepository.save(user);

      redisTemplate.delete(stagingKey);
    } catch (JsonProcessingException e) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
  }

  public AuthResponse login(LoginRequest request) {
    String email = request.getEmail();
    String lockoutKey = "login:lockout:" + email;
    String attemptsKey = "login:attempts:" + email;

    // Check if account is locked
    if (Boolean.TRUE.equals(redisTemplate.hasKey(lockoutKey))) {
      throw new AppException(ErrorCode.ACCOUNT_LOCKED);
    }

    User user = userRepository.findByEmail(email).orElse(null);

    boolean isPasswordMatch =
        user != null && passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

    if (!isPasswordMatch) {
      // Increment failed attempts
      Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
      if (attempts != null && attempts == 1) {
        // Window to count failed attempts (e.g. 5 minutes)
        redisTemplate.expire(attemptsKey, Duration.ofMinutes(5));
      }

      if (attempts != null && attempts >= MAX_FAILED_ATTEMPTS) {
        redisTemplate
            .opsForValue()
            .set(lockoutKey, "locked", Duration.ofMinutes(LOCKOUT_DURATION_MINUTES));
        redisTemplate.delete(attemptsKey);
      }

      throw new AppException(
          ErrorCode.UNAUTHENTICATED); // Generic message: "Invalid email or password"
    }

    // Password is correct, check active status
    if (!user.isActive()) {
      throw new AppException(ErrorCode.ACCOUNT_INACTIVE);
    }

    // Reset failed attempts on successful login
    redisTemplate.delete(attemptsKey);

    String accessToken = jwtUtils.generateAccessToken(user);
    String refreshToken = jwtUtils.generateRefreshToken(user);

    return new AuthResponse(
        accessToken, refreshToken, user.getId(), user.getEmail(), user.getRole().name());
  }
}
