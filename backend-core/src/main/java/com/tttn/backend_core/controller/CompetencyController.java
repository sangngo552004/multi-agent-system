package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.service.CompetencyService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

  @PostMapping
  public ResponseEntity<Competency> createCompetency(
      @Valid @RequestBody MasterDataRequest request) {
    return ResponseEntity.ok(competencyService.createCompetency(request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<Competency> updateCompetency(
      @PathVariable UUID id, @Valid @RequestBody MasterDataRequest request) {
    return ResponseEntity.ok(competencyService.updateCompetency(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteCompetency(@PathVariable UUID id) {
    competencyService.deleteCompetency(id);
    return ResponseEntity.ok().build();
  }
}
