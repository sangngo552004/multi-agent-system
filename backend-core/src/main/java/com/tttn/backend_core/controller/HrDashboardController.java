package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.HrDashboardResponse;
import com.tttn.backend_core.service.HrDashboardService;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hr/dashboard")
public class HrDashboardController {
  private final HrDashboardService hrDashboardService;

  public HrDashboardController(HrDashboardService hrDashboardService) {
    this.hrDashboardService = hrDashboardService;
  }

  @GetMapping
  public ApiResponse<HrDashboardResponse> getDashboard(
      @RequestParam(defaultValue = "7") int rangeDays, Principal principal) {
    return ApiResponse.success(hrDashboardService.getDashboard(principal.getName(), rangeDays));
  }
}
