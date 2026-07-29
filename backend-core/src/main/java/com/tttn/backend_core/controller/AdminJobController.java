package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.response.*;
import com.tttn.backend_core.entity.JobStatus;
import com.tttn.backend_core.service.AdminJobService;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/jobs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminJobController {

  private final AdminJobService adminJobService;

  public AdminJobController(AdminJobService adminJobService) {
    this.adminJobService = adminJobService;
  }

  @GetMapping("/filter-options")
  public ApiResponse<JobFilterOptionsResponse> getFilterOptions() {
    return ApiResponse.success(adminJobService.getFilterOptions());
  }

  @GetMapping
  public ApiResponse<AdminJobListResponse> findAll(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) JobStatus status,
      @RequestParam(required = false) UUID jobFamilyId,
      @RequestParam(required = false) UUID careerLevelId,
      @RequestParam(required = false) String readiness,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "createdAt,desc") String sort) {
    return ApiResponse.success(
        adminJobService.findAll(
            search, status, jobFamilyId, careerLevelId, readiness, page, size, sort));
  }

  @GetMapping("/{id}")
  public ApiResponse<AdminJobDetailResponse> findById(@PathVariable UUID id) {
    return ApiResponse.success(adminJobService.findById(id));
  }
}
