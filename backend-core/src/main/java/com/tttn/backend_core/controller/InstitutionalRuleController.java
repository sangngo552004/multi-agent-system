package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.InstitutionalRuleRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.entity.InstitutionalRule;
import com.tttn.backend_core.service.InstitutionalRuleService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/rules")
@RequiredArgsConstructor
public class InstitutionalRuleController {

  private final InstitutionalRuleService institutionalRuleService;

  @GetMapping
  public ApiResponse<Page<InstitutionalRule>> getRules(
      @QuerydslPredicate(root = InstitutionalRule.class) Predicate predicate, Pageable pageable) {
    return ApiResponse.success(institutionalRuleService.findAll(predicate, pageable));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<InstitutionalRule> createRule(
      @Valid @RequestBody InstitutionalRuleRequest request) {
    return ApiResponse.success(institutionalRuleService.createRule(request));
  }

  @PutMapping("/{id}")
  public ApiResponse<InstitutionalRule> updateRule(
      @PathVariable UUID id, @Valid @RequestBody InstitutionalRuleRequest request) {
    return ApiResponse.success(institutionalRuleService.updateRule(id, request));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> deleteRule(@PathVariable UUID id) {
    institutionalRuleService.deleteRule(id);
    return ApiResponse.success(null);
  }
}
