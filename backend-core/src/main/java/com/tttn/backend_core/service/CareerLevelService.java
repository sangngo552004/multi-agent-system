package com.tttn.backend_core.service;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.entity.CareerLevel;
import com.tttn.backend_core.repository.CareerLevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CareerLevelService {
  private final CareerLevelRepository careerLevelRepository;

  public Page<CareerLevel> findAll(Predicate predicate, Pageable pageable) {
    return careerLevelRepository.findAll(predicate, pageable);
  }
}
