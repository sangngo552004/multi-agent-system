package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.service.ApplicationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

  private final ApplicationService applicationService;

  @PostMapping("/{id}/approve")
  public ApiResponse<String> approveApplication(@PathVariable UUID id) {
    applicationService.approveApplication(id);
    return ApiResponse.success("Application approved successfully.");
  }

  @PostMapping("/{id}/reject")
  public ApiResponse<String> rejectApplication(@PathVariable UUID id) {
    applicationService.rejectApplication(id);
    return ApiResponse.success("Application rejected successfully.");
  }
}
