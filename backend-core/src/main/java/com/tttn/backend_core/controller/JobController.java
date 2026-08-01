package com.tttn.backend_core.controller;

import com.tttn.backend_core.annotation.RateLimit;
import com.tttn.backend_core.dto.request.AiParseRequest;
import com.tttn.backend_core.dto.request.JobCompetencyRequest;
import com.tttn.backend_core.dto.request.JobFilterRequest;
import com.tttn.backend_core.dto.request.JobRequest;
import com.tttn.backend_core.dto.request.JobRuleUpdateRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.ApplicationResponse;
import com.tttn.backend_core.dto.response.JobParseResponse;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.security.CustomUserPrincipal;
import com.tttn.backend_core.service.AiParsingService;
import com.tttn.backend_core.service.ApplicationService;
import com.tttn.backend_core.service.JobService;
import jakarta.validation.Valid;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/jobs")
@RequiredArgsConstructor
public class JobController {

  private final JobService jobService;
  private final AiParsingService aiParsingService;
  private final ApplicationService applicationService;

  @GetMapping
  public ApiResponse<Page<JobResponse>> getJobs(JobFilterRequest filter, Pageable pageable) {
    return ApiResponse.success(jobService.getJobs(filter, pageable));
  }

  @GetMapping("/{id}/applications")
  public ApiResponse<Page<ApplicationResponse>> getApplicationsByJob(
      @PathVariable UUID id,
      @RequestParam(required = false) com.tttn.backend_core.entity.ApplicationStatus status,
      @RequestParam(required = false) com.tttn.backend_core.entity.AiProcessingStatus aiStatus,
      @RequestParam(required = false) Boolean needsReview,
      Pageable pageable) {
    return ApiResponse.success(
        applicationService.getApplicationsByJob(id, status, aiStatus, needsReview, pageable));
  }

  @PostMapping("/parse")
  @RateLimit(action = "ai_parse_jd", maxRequests = 10, duration = 1, unit = ChronoUnit.HOURS)
  public ApiResponse<JobParseResponse> parseJd(@Valid @RequestBody AiParseRequest request) {
    return ApiResponse.success(aiParsingService.parseJd(request));
  }

  @GetMapping("/{id}")
  public ApiResponse<JobResponse> getJobDetail(@PathVariable UUID id) {
    return ApiResponse.success(jobService.getJobDetail(id));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<JobResponse> createJob(
      @AuthenticationPrincipal CustomUserPrincipal user, @Valid @RequestBody JobRequest request) {
    return ApiResponse.success(jobService.createJob(user.getUserId(), request));
  }

  @PutMapping("/{id}")
  public ApiResponse<JobResponse> updateJob(
      @PathVariable UUID id, @Valid @RequestBody JobRequest request) {
    return ApiResponse.success(jobService.updateJob(id, request));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> deleteJob(@PathVariable UUID id) {
    jobService.deleteJob(id);
    return ApiResponse.success(null);
  }

  @PostMapping("/{id}/duplicate")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<JobResponse> duplicateJob(@PathVariable UUID id) {
    return ApiResponse.success(jobService.duplicateJob(id));
  }

  @PutMapping("/{id}/competencies")
  public ApiResponse<JobResponse> updateJobCompetencies(
      @PathVariable UUID id, @Valid @RequestBody List<JobCompetencyRequest> requests) {
    return ApiResponse.success(jobService.updateJobCompetencies(id, requests));
  }

  @PutMapping("/{id}/rules")
  public ApiResponse<JobResponse> updateJobRules(
      @PathVariable UUID id, @Valid @RequestBody JobRuleUpdateRequest request) {
    return ApiResponse.success(jobService.updateJobRules(id, request));
  }
}
