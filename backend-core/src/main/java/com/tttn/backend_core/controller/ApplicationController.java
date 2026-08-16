package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.request.BatchEmailRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.ApplicationResponse;
import com.tttn.backend_core.dto.response.BatchJobResponse;
import com.tttn.backend_core.service.ApplicationService;
import com.tttn.backend_core.service.BatchJobService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/applications")
@RequiredArgsConstructor
public class ApplicationController {

  private final ApplicationService applicationService;
  private final BatchJobService batchJobService;

  @PostMapping("/{id}/approve")
  public ApiResponse<String> approveApplication(@PathVariable UUID id, Principal principal) {
    applicationService.approveApplication(id, principal.getName());
    return ApiResponse.success("Application approved successfully.");
  }

  @PostMapping("/{id}/reject")
  public ApiResponse<String> rejectApplication(@PathVariable UUID id, Principal principal) {
    applicationService.rejectApplication(id, principal.getName());
    return ApiResponse.success("Application rejected successfully.");
  }

  @PostMapping("/{id}/retry-career-path")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public ApiResponse<String> retryCareerPath(@PathVariable UUID id, Principal principal) {
    applicationService.retryCareerPath(id, principal.getName());
    return ApiResponse.success("Career Path request accepted.");
  }

  @PostMapping("/batch-email")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public ApiResponse<String> batchEmail(
      @Valid @RequestBody BatchEmailRequest request, Principal principal) {
    String batchJobId = batchJobService.createBatchJob(request, principal.getName());
    return ApiResponse.success("Batch email request accepted. Tracking ID: " + batchJobId);
  }

  @GetMapping("/{id}")
  public ApiResponse<ApplicationResponse> getApplicationDetail(
      @PathVariable UUID id, Principal principal) {
    return ApiResponse.success(applicationService.getApplicationDetail(id, principal.getName()));
  }

  @GetMapping
  public ApiResponse<Page<ApplicationResponse>> findAll(
      @RequestParam(required = false) UUID jobId,
      @RequestParam(required = false) com.tttn.backend_core.entity.ApplicationStatus status,
      @RequestParam(required = false) com.tttn.backend_core.entity.AiProcessingStatus aiStatus,
      @RequestParam(required = false) Boolean needsReview,
      @RequestParam(required = false) String search,
      Pageable pageable,
      Principal principal) {
    return ApiResponse.success(
        applicationService.findForHr(
            principal.getName(), jobId, status, aiStatus, needsReview, search, pageable));
  }

  @GetMapping("/batch-email/{batchJobId}")
  public ApiResponse<BatchJobResponse> getBatchJobStatus(
      @PathVariable String batchJobId, Principal principal) {
    return ApiResponse.success(batchJobService.getBatchJobStatus(batchJobId, principal.getName()));
  }

  @GetMapping("/batch-email")
  public ApiResponse<java.util.List<BatchJobResponse>> getBatchHistory(
      @RequestParam UUID jobId, Principal principal) {
    return ApiResponse.success(batchJobService.getBatchHistory(jobId, principal.getName()));
  }
}
