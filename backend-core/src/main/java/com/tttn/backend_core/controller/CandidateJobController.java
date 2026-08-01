package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.service.JobService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/candidate/jobs")
@RequiredArgsConstructor
public class CandidateJobController {

  private final JobService jobService;

  @GetMapping("/{id}")
  public ApiResponse<JobResponse> getJobDetail(@PathVariable UUID id) {
    return ApiResponse.success(jobService.getJobDetail(id));
  }
}
