package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.entity.JobFamily;
import com.tttn.backend_core.service.JobFamilyService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/job-families")
@RequiredArgsConstructor
public class JobFamilyController {

  private final JobFamilyService jobFamilyService;

  @GetMapping
  public Page<JobFamily> getJobFamilies(
      @QuerydslPredicate(root = JobFamily.class) Predicate predicate, Pageable pageable) {
    return jobFamilyService.findAll(predicate, pageable);
  }

  @PostMapping
  public ResponseEntity<JobFamily> createJobFamily(@Valid @RequestBody MasterDataRequest request) {
    return ResponseEntity.ok(jobFamilyService.createJobFamily(request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<JobFamily> updateJobFamily(
      @PathVariable UUID id, @Valid @RequestBody MasterDataRequest request) {
    return ResponseEntity.ok(jobFamilyService.updateJobFamily(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteJobFamily(@PathVariable UUID id) {
    jobFamilyService.deleteJobFamily(id);
    return ResponseEntity.ok().build();
  }
}
