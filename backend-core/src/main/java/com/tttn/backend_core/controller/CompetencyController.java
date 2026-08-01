package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.service.CompetencyService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/competencies")
@RequiredArgsConstructor
public class CompetencyController {

  private final CompetencyService competencyService;

  @GetMapping
  public ApiResponse<Page<Competency>> getCompetencies(
      @QuerydslPredicate(root = Competency.class) Predicate predicate, Pageable pageable) {
    return ApiResponse.success(competencyService.findAll(predicate, pageable));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<Competency> createCompetency(@Valid @RequestBody MasterDataRequest request) {
    return ApiResponse.success(competencyService.createCompetency(request));
  }

  @PutMapping("/{id}")
  public ApiResponse<Competency> updateCompetency(
      @PathVariable UUID id, @Valid @RequestBody MasterDataRequest request) {
    return ApiResponse.success(competencyService.updateCompetency(id, request));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> deleteCompetency(@PathVariable UUID id) {
    competencyService.deleteCompetency(id);
    return ApiResponse.success(null);
  }
}
