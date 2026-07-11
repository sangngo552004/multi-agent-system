package com.tttn.backend_core.controller;

import com.tttn.backend_core.annotation.RateLimit;
import com.tttn.backend_core.dto.request.LoginRequest;
import com.tttn.backend_core.dto.request.RegisterRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.AuthResponse;
import com.tttn.backend_core.service.AuthService;
import jakarta.validation.Valid;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @RateLimit(action = "REGISTER", maxRequests = 1, duration = 1, unit = ChronoUnit.MINUTES)
  @RateLimit(action = "REGISTER", maxRequests = 10, duration = 1, unit = ChronoUnit.DAYS)
  @PostMapping("/register")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public ApiResponse<String> register(@Valid @RequestBody RegisterRequest request) {
    authService.register(request);
    return ApiResponse.success("Một email hướng dẫn đã được gửi đến bạn.");
  }

  @GetMapping("/verify")
  public ApiResponse<String> verify(@RequestParam("token") String token) {
    authService.verifyRegistration(token);
    return ApiResponse.success("Xác nhận thành công. Bạn có thể đăng nhập.");
  }

  @RateLimit(action = "LOGIN", maxRequests = 5, duration = 1, unit = ChronoUnit.MINUTES)
  @PostMapping("/login")
  public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    return ApiResponse.success(authService.login(request));
  }
}
