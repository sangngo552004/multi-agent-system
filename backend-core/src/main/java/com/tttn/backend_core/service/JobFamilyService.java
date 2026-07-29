package com.tttn.backend_core.service;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.entity.JobFamily;
import com.tttn.backend_core.repository.JobFamilyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JobFamilyService {
  private final JobFamilyRepository jobFamilyRepository;

  public Page<JobFamily> findAll(Predicate predicate, Pageable pageable) {
    return jobFamilyRepository.findAll(predicate, pageable);
  }
}
