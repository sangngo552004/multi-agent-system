package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.entity.JobFamily;
import com.tttn.backend_core.service.JobFamilyService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/job-families")
@RequiredArgsConstructor
public class JobFamilyController {

  private final JobFamilyService jobFamilyService;

  @GetMapping
  public ApiResponse<Page<JobFamily>> getJobFamilies(
      @QuerydslPredicate(root = JobFamily.class) Predicate predicate, Pageable pageable) {
    return ApiResponse.success(jobFamilyService.findAll(predicate, pageable));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<JobFamily> createJobFamily(@Valid @RequestBody MasterDataRequest request) {
    return ApiResponse.success(jobFamilyService.createJobFamily(request));
  }

  @PutMapping("/{id}")
  public ApiResponse<JobFamily> updateJobFamily(
      @PathVariable UUID id, @Valid @RequestBody MasterDataRequest request) {
    return ApiResponse.success(jobFamilyService.updateJobFamily(id, request));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> deleteJobFamily(@PathVariable UUID id) {
    jobFamilyService.deleteJobFamily(id);
    return ApiResponse.success(null);
  }
}
