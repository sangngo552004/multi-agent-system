package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.entity.CareerLevel;
import com.tttn.backend_core.service.CareerLevelService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hr/career-levels")
@RequiredArgsConstructor
public class CareerLevelController {

  private final CareerLevelService careerLevelService;

  @GetMapping
  public Page<CareerLevel> getCareerLevels(
      @QuerydslPredicate(root = CareerLevel.class) Predicate predicate, Pageable pageable) {
    return careerLevelService.findAll(predicate, pageable);
  }
}
