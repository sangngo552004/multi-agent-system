package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.request.PedigreeGroupRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.PedigreeGroupResponse;
import com.tttn.backend_core.service.PedigreeGroupService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hr/knowledge-base/pedigree-groups")
@RequiredArgsConstructor
public class PedigreeGroupController {
  private final PedigreeGroupService service;

  @GetMapping
  public ApiResponse<List<PedigreeGroupResponse>> findAll() {
    return ApiResponse.success(service.findAll());
  }

  @PostMapping
  public ApiResponse<PedigreeGroupResponse> create(
      @Valid @RequestBody PedigreeGroupRequest request) {
    return ApiResponse.success(service.save(null, request));
  }

  @PutMapping("/{id}")
  public ApiResponse<PedigreeGroupResponse> update(
      @PathVariable UUID id, @Valid @RequestBody PedigreeGroupRequest request) {
    return ApiResponse.success(service.save(id, request));
  }
}
