package com.tttn.backend_core.controller;

import com.tttn.backend_core.annotation.RateLimit;
import com.tttn.backend_core.dto.request.LoginRequest;
import com.tttn.backend_core.dto.request.RegisterRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.AuthResponse;
import com.tttn.backend_core.dto.response.CurrentUserResponse;
import com.tttn.backend_core.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Slf4j
public class AuthController {

  private final AuthService authService;

  @Value("${auth.refresh-cookie-secure:false}")
  private boolean secureRefreshCookie;

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
  @PostMapping("/candidate/login")
  public ApiResponse<AuthResponse> candidateLogin(
      @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
    log.info("Candidate login request received: email={}", request.getEmail());
    AuthResponse auth =
        authService.login(request, List.of(com.tttn.backend_core.entity.Role.CANDIDATE));
    setRefreshCookie(response, auth.getRefreshToken(), Duration.ofDays(7));
    log.info("Candidate login succeeded: email={}", auth.getEmail());
    return ApiResponse.success(auth);
  }

  @RateLimit(action = "LOGIN", maxRequests = 5, duration = 1, unit = ChronoUnit.MINUTES)
  @PostMapping("/hr/login")
  public ApiResponse<AuthResponse> hrLogin(
      @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
    log.info("HR login request received: email={}", request.getEmail());
    AuthResponse auth = authService.login(request, List.of(com.tttn.backend_core.entity.Role.HR));
    setRefreshCookie(response, auth.getRefreshToken(), Duration.ofDays(7));
    log.info("HR login succeeded: email={}", auth.getEmail());
    return ApiResponse.success(auth);
  }

  @RateLimit(action = "LOGIN", maxRequests = 5, duration = 1, unit = ChronoUnit.MINUTES)
  @PostMapping("/admin/login")
  public ApiResponse<AuthResponse> adminLogin(
      @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
    log.info("Admin login request received: email={}", request.getEmail());
    AuthResponse auth =
        authService.login(request, List.of(com.tttn.backend_core.entity.Role.ADMIN));
    setRefreshCookie(response, auth.getRefreshToken(), Duration.ofDays(7));
    log.info("Admin login succeeded: email={}", auth.getEmail());
    return ApiResponse.success(auth);
  }

  @GetMapping("/me")
  public ApiResponse<CurrentUserResponse> me(Principal principal) {
    return ApiResponse.success(authService.currentUser(principal.getName()));
  }

  @PostMapping("/refresh")
  public ApiResponse<AuthResponse> refresh(
      @CookieValue(name = "refresh_token", required = false) String refreshToken,
      HttpServletResponse response) {
    AuthResponse auth = authService.refresh(refreshToken);
    setRefreshCookie(response, auth.getRefreshToken(), Duration.ofDays(7));
    return ApiResponse.success(auth);
  }

  @PostMapping("/logout")
  public ApiResponse<Void> logout(
      @CookieValue(name = "refresh_token", required = false) String refreshToken,
      HttpServletResponse response) {
    authService.logout(refreshToken);
    setRefreshCookie(response, "", Duration.ZERO);
    return ApiResponse.success(null);
  }

  private void setRefreshCookie(
      HttpServletResponse response, String refreshToken, Duration maxAge) {
    ResponseCookie cookie =
        ResponseCookie.from("refresh_token", refreshToken == null ? "" : refreshToken)
            .httpOnly(true)
            .secure(secureRefreshCookie)
            .sameSite("Lax")
            // Must match /api/v1/auth/refresh; otherwise browsers omit the cookie after reload.
            .path("/api/v1/auth")
            .maxAge(maxAge)
            .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}
