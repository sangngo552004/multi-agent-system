package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.entity.CareerLevel;
import com.tttn.backend_core.service.CareerLevelService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/career-levels")
@RequiredArgsConstructor
public class CareerLevelController {

  private final CareerLevelService careerLevelService;

  @GetMapping
  public ApiResponse<Page<CareerLevel>> getCareerLevels(
      @QuerydslPredicate(root = CareerLevel.class) Predicate predicate, Pageable pageable) {
    return ApiResponse.success(careerLevelService.findAll(predicate, pageable));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<CareerLevel> createCareerLevel(@Valid @RequestBody MasterDataRequest request) {
    return ApiResponse.success(careerLevelService.createCareerLevel(request));
  }

  @PutMapping("/{id}")
  public ApiResponse<CareerLevel> updateCareerLevel(
      @PathVariable UUID id, @Valid @RequestBody MasterDataRequest request) {
    return ApiResponse.success(careerLevelService.updateCareerLevel(id, request));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> deleteCareerLevel(@PathVariable UUID id) {
    careerLevelService.deleteCareerLevel(id);
    return ApiResponse.success(null);
  }
}
