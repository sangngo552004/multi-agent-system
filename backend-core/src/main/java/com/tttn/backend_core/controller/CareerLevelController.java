package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.entity.CareerLevel;
import com.tttn.backend_core.service.CareerLevelService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

  @PostMapping
  public ResponseEntity<CareerLevel> createCareerLevel(
      @Valid @RequestBody MasterDataRequest request) {
    return ResponseEntity.ok(careerLevelService.createCareerLevel(request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<CareerLevel> updateCareerLevel(
      @PathVariable UUID id, @Valid @RequestBody MasterDataRequest request) {
    return ResponseEntity.ok(careerLevelService.updateCareerLevel(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteCareerLevel(@PathVariable UUID id) {
    careerLevelService.deleteCareerLevel(id);
    return ResponseEntity.ok().build();
  }
}
