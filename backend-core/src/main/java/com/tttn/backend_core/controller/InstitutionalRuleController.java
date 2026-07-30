package com.tttn.backend_core.controller;

import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.InstitutionalRuleRequest;
import com.tttn.backend_core.entity.InstitutionalRule;
import com.tttn.backend_core.service.InstitutionalRuleService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/rules")
@RequiredArgsConstructor
public class InstitutionalRuleController {

  private final InstitutionalRuleService institutionalRuleService;

  @GetMapping
  public Page<InstitutionalRule> getRules(
      @QuerydslPredicate(root = InstitutionalRule.class) Predicate predicate, Pageable pageable) {
    return institutionalRuleService.findAll(predicate, pageable);
  }

  @PostMapping
  public ResponseEntity<InstitutionalRule> createRule(
      @Valid @RequestBody InstitutionalRuleRequest request) {
    return ResponseEntity.ok(institutionalRuleService.createRule(request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<InstitutionalRule> updateRule(
      @PathVariable UUID id, @Valid @RequestBody InstitutionalRuleRequest request) {
    return ResponseEntity.ok(institutionalRuleService.updateRule(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteRule(@PathVariable UUID id) {
    institutionalRuleService.deleteRule(id);
    return ResponseEntity.ok().build();
  }
}
