package com.tttn.backend_core.service;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.entity.InstitutionalRule;
import com.tttn.backend_core.repository.InstitutionalRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InstitutionalRuleService {
  private final InstitutionalRuleRepository institutionalRuleRepository;

  public Page<InstitutionalRule> findAll(Predicate predicate, Pageable pageable) {
    return institutionalRuleRepository.findAll(predicate, pageable);
  }
}
