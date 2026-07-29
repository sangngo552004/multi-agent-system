package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.AiParseRequest;
import com.tttn.backend_core.dto.request.JobCompetencyRequest;
import com.tttn.backend_core.dto.request.JobFilterRequest;
import com.tttn.backend_core.dto.request.JobRequest;
import com.tttn.backend_core.dto.request.JobRuleUpdateRequest;
import com.tttn.backend_core.dto.response.ApplicationResponse;
import com.tttn.backend_core.dto.response.JobParseResponse;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.entity.Application;
import com.tttn.backend_core.security.CustomUserPrincipal;
import com.tttn.backend_core.service.AiParsingService;
import com.tttn.backend_core.service.ApplicationService;
import com.tttn.backend_core.service.JobService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
  public ResponseEntity<Page<JobResponse>> getJobs(JobFilterRequest filter, Pageable pageable) {
    return ResponseEntity.ok(jobService.getJobs(filter, pageable));
  }

  @GetMapping("/{id}/applications")
  public ResponseEntity<Page<ApplicationResponse>> getApplicationsByJob(
      @PathVariable UUID id,
      @QuerydslPredicate(root = Application.class) Predicate predicate,
      Pageable pageable) {
    return ResponseEntity.ok(applicationService.getApplicationsByJob(id, predicate, pageable));
  }

  @PostMapping("/parse")
  public ResponseEntity<JobParseResponse> parseJd(@Valid @RequestBody AiParseRequest request) {
    return ResponseEntity.ok(aiParsingService.parseJd(request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<JobResponse> getJobDetail(@PathVariable UUID id) {
    return ResponseEntity.ok(jobService.getJobDetail(id));
  }

  @PostMapping
  public ResponseEntity<JobResponse> createJob(
      @AuthenticationPrincipal CustomUserPrincipal user, @Valid @RequestBody JobRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(jobService.createJob(user.getUserId(), request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<JobResponse> updateJob(
      @PathVariable UUID id, @Valid @RequestBody JobRequest request) {
    return ResponseEntity.ok(jobService.updateJob(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteJob(@PathVariable UUID id) {
    jobService.deleteJob(id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{id}/duplicate")
  public ResponseEntity<JobResponse> duplicateJob(@PathVariable UUID id) {
    return ResponseEntity.status(HttpStatus.CREATED).body(jobService.duplicateJob(id));
  }

  @PutMapping("/{id}/competencies")
  public ResponseEntity<JobResponse> updateJobCompetencies(
      @PathVariable UUID id, @Valid @RequestBody List<JobCompetencyRequest> requests) {
    return ResponseEntity.ok(jobService.updateJobCompetencies(id, requests));
  }

  @PutMapping("/{id}/rules")
  public ResponseEntity<JobResponse> updateJobRules(
      @PathVariable UUID id, @Valid @RequestBody JobRuleUpdateRequest request) {
    return ResponseEntity.ok(jobService.updateJobRules(id, request));
  }
}
