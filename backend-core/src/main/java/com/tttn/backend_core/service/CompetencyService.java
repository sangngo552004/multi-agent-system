package com.tttn.backend_core.service;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.repository.CompetencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CompetencyService {
  private final CompetencyRepository competencyRepository;

  public Page<Competency> findAll(Predicate predicate, Pageable pageable) {
    return competencyRepository.findAll(predicate, pageable);
  }
}
