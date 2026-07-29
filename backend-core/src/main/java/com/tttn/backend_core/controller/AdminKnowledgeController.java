package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.request.CareerLevelKnowledgeRequest;
import com.tttn.backend_core.dto.request.CompetencyKnowledgeRequest;
import com.tttn.backend_core.dto.request.CompetencyLevelsRequest;
import com.tttn.backend_core.dto.request.JobFamilyKnowledgeRequest;
import com.tttn.backend_core.dto.request.KnowledgeStatusRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.KnowledgeOverviewResponse;
import com.tttn.backend_core.service.AdminKnowledgeService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/knowledge")
@PreAuthorize("hasRole('ADMIN')")
public class AdminKnowledgeController {

  private final AdminKnowledgeService adminKnowledgeService;

  public AdminKnowledgeController(AdminKnowledgeService adminKnowledgeService) {
    this.adminKnowledgeService = adminKnowledgeService;
  }

  @GetMapping("/overview")
  public ApiResponse<KnowledgeOverviewResponse> getOverview() {
    return ApiResponse.success(adminKnowledgeService.getOverview());
  }

  @GetMapping("/competencies/{id}")
  public ApiResponse<KnowledgeOverviewResponse.CompetencyItem> getCompetency(
      @PathVariable UUID id) {
    return ApiResponse.success(adminKnowledgeService.getCompetency(id));
  }

  @PostMapping("/job-families")
  public ApiResponse<KnowledgeOverviewResponse.JobFamilyItem> createJobFamily(
      @Valid @RequestBody JobFamilyKnowledgeRequest request, Principal principal) {
    return ApiResponse.success(adminKnowledgeService.createJobFamily(request, principal.getName()));
  }

  @PutMapping("/job-families/{id}")
  public ApiResponse<KnowledgeOverviewResponse.JobFamilyItem> updateJobFamily(
      @PathVariable UUID id,
      @Valid @RequestBody JobFamilyKnowledgeRequest request,
      Principal principal) {
    return ApiResponse.success(
        adminKnowledgeService.updateJobFamily(id, request, principal.getName()));
  }

  @PostMapping("/career-levels")
  public ApiResponse<KnowledgeOverviewResponse.CareerLevelItem> createCareerLevel(
      @Valid @RequestBody CareerLevelKnowledgeRequest request, Principal principal) {
    return ApiResponse.success(
        adminKnowledgeService.createCareerLevel(request, principal.getName()));
  }

  @PutMapping("/career-levels/{id}")
  public ApiResponse<KnowledgeOverviewResponse.CareerLevelItem> updateCareerLevel(
      @PathVariable UUID id,
      @Valid @RequestBody CareerLevelKnowledgeRequest request,
      Principal principal) {
    return ApiResponse.success(
        adminKnowledgeService.updateCareerLevel(id, request, principal.getName()));
  }

  @PostMapping("/competencies")
  public ApiResponse<KnowledgeOverviewResponse.CompetencyItem> createCompetency(
      @Valid @RequestBody CompetencyKnowledgeRequest request, Principal principal) {
    return ApiResponse.success(
        adminKnowledgeService.createCompetency(request, principal.getName()));
  }

  @PutMapping("/competencies/{id}")
  public ApiResponse<KnowledgeOverviewResponse.CompetencyItem> updateCompetency(
      @PathVariable UUID id,
      @Valid @RequestBody CompetencyKnowledgeRequest request,
      Principal principal) {
    return ApiResponse.success(
        adminKnowledgeService.updateCompetency(id, request, principal.getName()));
  }

  @PutMapping("/competencies/{id}/levels")
  public ApiResponse<KnowledgeOverviewResponse.CompetencyItem> updateCompetencyLevels(
      @PathVariable UUID id,
      @Valid @RequestBody CompetencyLevelsRequest request,
      Principal principal) {
    return ApiResponse.success(
        adminKnowledgeService.updateCompetencyLevels(id, request, principal.getName()));
  }

  @PatchMapping("/{entity}/{id}/status")
  public ApiResponse<KnowledgeOverviewResponse> updateStatus(
      @PathVariable String entity,
      @PathVariable UUID id,
      @Valid @RequestBody KnowledgeStatusRequest request,
      Principal principal) {
    return ApiResponse.success(
        adminKnowledgeService.updateStatus(entity, id, request, principal.getName()));
  }
}
