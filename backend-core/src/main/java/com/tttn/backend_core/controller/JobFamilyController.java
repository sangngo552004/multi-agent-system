package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.entity.JobFamily;
import com.tttn.backend_core.service.JobFamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
