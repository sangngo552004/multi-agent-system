package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.entity.InstitutionalRule;
import com.tttn.backend_core.service.InstitutionalRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hr/institutional-rules")
@RequiredArgsConstructor
public class InstitutionalRuleController {

  private final InstitutionalRuleService institutionalRuleService;

  @GetMapping
  public Page<InstitutionalRule> getInstitutionalRules(
      @QuerydslPredicate(root = InstitutionalRule.class) Predicate predicate, Pageable pageable) {
    return institutionalRuleService.findAll(predicate, pageable);
  }
}
