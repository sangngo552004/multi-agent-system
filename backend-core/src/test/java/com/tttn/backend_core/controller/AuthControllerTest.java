package com.tttn.backend_core.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tttn.backend_core.dto.request.LoginRequest;
import com.tttn.backend_core.dto.request.RegisterRequest;
import com.tttn.backend_core.dto.response.AuthResponse;
import com.tttn.backend_core.entity.Role;
import com.tttn.backend_core.service.AuthService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

  private MockMvc mockMvc;

  @Mock private AuthService authService;

  @InjectMocks private AuthController authController;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
  }

  @Test
  void testRegister() throws Exception {
    RegisterRequest request = new RegisterRequest();
    request.setEmail("test@test.com");
    request.setPassword("Password123!");
    request.setFullName("Test User");
    request.setRole(Role.HR);

    doNothing().when(authService).register(any(RegisterRequest.class));

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isAccepted())
        .andExpect(jsonPath("$.code").value(1000))
        .andExpect(jsonPath("$.result").value("Một email hướng dẫn đã được gửi đến bạn."));
  }

  @Test
  void testVerify() throws Exception {
    doNothing().when(authService).verifyRegistration("token-123");

    mockMvc
        .perform(get("/api/auth/verify").param("token", "token-123"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value(1000))
        .andExpect(jsonPath("$.result").value("Xác nhận thành công. Bạn có thể đăng nhập."));
  }

  @Test
  void testLogin() throws Exception {
    LoginRequest request = new LoginRequest();
    request.setEmail("test@test.com");
    request.setPassword("password");

    AuthResponse response =
        new AuthResponse("access", "refresh", UUID.randomUUID(), "test@test.com", "HR");
    when(authService.login(any(LoginRequest.class))).thenReturn(response);

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value(1000))
        .andExpect(jsonPath("$.result.token").value("access"));
  }
}
