package com.tttn.backend_core.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tttn.backend_core.dto.response.AdminDashboardResponse;
import com.tttn.backend_core.entity.AiProcessingStatus;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.exception.GlobalExceptionHandler;
import com.tttn.backend_core.service.AdminDashboardService;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AdminDashboardControllerTest {

  @Mock private AdminDashboardService adminDashboardService;

  @InjectMocks private AdminDashboardController adminDashboardController;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc =
        MockMvcBuilders.standaloneSetup(adminDashboardController)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
  }

  @Test
  void getDashboardUsesSevenDayRangeByDefault() throws Exception {
    when(adminDashboardService.getDashboard(7)).thenReturn(dashboardResponse());

    mockMvc
        .perform(get("/api/v1/admin/dashboard"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value(1000))
        .andExpect(jsonPath("$.result.rangeDays").value(7))
        .andExpect(jsonPath("$.result.metrics.totalUsers").value(10));

    verify(adminDashboardService).getDashboard(7);
  }

  @Test
  void getDashboardReturnsBadRequestForUnsupportedRange() throws Exception {
    when(adminDashboardService.getDashboard(14))
        .thenThrow(new AppException(ErrorCode.INVALID_DASHBOARD_RANGE));

    mockMvc
        .perform(get("/api/v1/admin/dashboard").param("rangeDays", "14"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1043));
  }

  @Test
  void getDashboardReturnsBadRequestForMalformedRange() throws Exception {
    mockMvc
        .perform(get("/api/v1/admin/dashboard").param("rangeDays", "seven"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1001))
        .andExpect(jsonPath("$.message").value("Invalid request"));
  }

  private AdminDashboardResponse dashboardResponse() {
    EnumMap<AiProcessingStatus, Long> counts = new EnumMap<>(AiProcessingStatus.class);
    for (AiProcessingStatus status : AiProcessingStatus.values()) {
      counts.put(status, 0L);
    }
    return new AdminDashboardResponse(
        7,
        Instant.parse("2026-07-29T10:00:00Z"),
        true,
        new AdminDashboardResponse.Metrics(10, 1, 2, 1, 3, 2, 1, 67),
        counts,
        List.of(),
        List.of());
  }
}
