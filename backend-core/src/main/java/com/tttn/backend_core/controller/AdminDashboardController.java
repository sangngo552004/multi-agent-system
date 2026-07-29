package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.response.AdminDashboardResponse;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

  private final AdminDashboardService adminDashboardService;

  public AdminDashboardController(AdminDashboardService adminDashboardService) {
    this.adminDashboardService = adminDashboardService;
  }

  @GetMapping
  @Operation(
      summary = "Get the admin operational dashboard",
      description =
          "Aggregates users, jobs, applications, AI processing statuses, and recent activities "
              + "over a UTC calendar-day window.")
  public ApiResponse<AdminDashboardResponse> getDashboard(
      @Parameter(
              description = "Number of UTC calendar days to include",
              schema =
                  @Schema(
                      allowableValues = {"7", "30"},
                      defaultValue = "7"))
          @RequestParam(defaultValue = "7")
          int rangeDays) {
    return ApiResponse.success(adminDashboardService.getDashboard(rangeDays));
  }
}
