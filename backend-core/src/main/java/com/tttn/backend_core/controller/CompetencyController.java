package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.service.CompetencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hr/competencies")
@RequiredArgsConstructor
public class CompetencyController {

  private final CompetencyService competencyService;

  @GetMapping
  public Page<Competency> getCompetencies(
      @QuerydslPredicate(root = Competency.class) Predicate predicate, Pageable pageable) {
    return competencyService.findAll(predicate, pageable);
  }
}
