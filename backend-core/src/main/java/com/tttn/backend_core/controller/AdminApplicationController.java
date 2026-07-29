package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.response.AdminApplicationDetailResponse;
import com.tttn.backend_core.dto.response.AdminApplicationResponse;
import com.tttn.backend_core.dto.response.AiRetryAcceptedResponse;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.PageResponse;
import com.tttn.backend_core.entity.AiProcessingStatus;
import com.tttn.backend_core.service.AdminApplicationService;
import java.security.Principal;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/applications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminApplicationController {

  private final AdminApplicationService adminApplicationService;

  public AdminApplicationController(AdminApplicationService adminApplicationService) {
    this.adminApplicationService = adminApplicationService;
  }

  @GetMapping
  public ApiResponse<PageResponse<AdminApplicationResponse>> findAll(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) AiProcessingStatus aiStatus,
      @RequestParam(defaultValue = "ALL") String dateRange,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "submittedAt,desc") String sort) {
    return ApiResponse.success(
        adminApplicationService.findAll(search, aiStatus, dateRange, page, size, sort));
  }

  @GetMapping("/{id}")
  public ApiResponse<AdminApplicationDetailResponse> findById(@PathVariable UUID id) {
    return ApiResponse.success(adminApplicationService.findById(id));
  }

  @PostMapping("/{id}/ai-retries")
  public ResponseEntity<ApiResponse<AiRetryAcceptedResponse>> retry(
      @PathVariable UUID id,
      @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
      Principal principal) {
    return ResponseEntity.status(HttpStatus.ACCEPTED)
        .body(
            ApiResponse.success(
                adminApplicationService.retry(id, idempotencyKey, principal.getName())));
  }
}
