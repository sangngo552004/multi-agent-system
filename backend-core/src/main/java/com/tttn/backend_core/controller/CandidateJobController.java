package com.tttn.backend_core.controller;

import com.tttn.backend_core.annotation.RateLimit;
import com.tttn.backend_core.dto.request.JobFilterRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.entity.JobStatus;
import com.tttn.backend_core.service.JobService;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class CandidateJobController {

  private final JobService jobService;

  @GetMapping
  @RateLimit(action = "view_jobs", maxRequests = 60, duration = 1, unit = ChronoUnit.MINUTES)
  public ApiResponse<Page<JobResponse>> getJobs(
      @ModelAttribute JobFilterRequest filter, Pageable pageable) {
    if (filter == null) {
      filter = new JobFilterRequest();
    }
    // Force status to PUBLISHED for public view
    filter.setStatus(JobStatus.PUBLISHED);
    return ApiResponse.success(jobService.getJobs(filter, pageable));
  }

  @GetMapping("/{id}")
  @RateLimit(action = "view_job", maxRequests = 30, duration = 1, unit = ChronoUnit.MINUTES)
  public ApiResponse<JobResponse> getJobDetail(@PathVariable UUID id) {
    return ApiResponse.success(jobService.getJobDetail(id));
  }
}
