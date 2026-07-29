package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.request.JobFilterRequest;
import com.tttn.backend_core.dto.request.JobRequest;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.service.JobService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/jobs")
@RequiredArgsConstructor
public class JobController {

  private final JobService jobService;

  @GetMapping
  public ResponseEntity<Page<JobResponse>> getJobs(JobFilterRequest filter, Pageable pageable) {
    return ResponseEntity.ok(jobService.getJobs(filter, pageable));
  }

  @GetMapping("/{id}")
  public ResponseEntity<JobResponse> getJobDetail(@PathVariable UUID id) {
    return ResponseEntity.ok(jobService.getJobDetail(id));
  }

  @PostMapping
  public ResponseEntity<JobResponse> createJob(@Valid @RequestBody JobRequest request) {
    String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
    UUID hrId = UUID.fromString(userIdStr);
    return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createJob(hrId, request));
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
}
