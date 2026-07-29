package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.request.UserStatusRequest;
import com.tttn.backend_core.dto.response.AdminUserResponse;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.PageResponse;
import com.tttn.backend_core.entity.Role;
import com.tttn.backend_core.service.AdminUserService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

  private final AdminUserService adminUserService;

  public AdminUserController(AdminUserService adminUserService) {
    this.adminUserService = adminUserService;
  }

  @GetMapping
  public ApiResponse<PageResponse<AdminUserResponse>> findAll(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) Role role,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "createdAt,desc") String sort) {
    return ApiResponse.success(adminUserService.findAll(search, role, status, page, size, sort));
  }

  @GetMapping("/{id}")
  public ApiResponse<AdminUserResponse> findById(@PathVariable UUID id) {
    return ApiResponse.success(adminUserService.findById(id));
  }

  @PatchMapping("/{id}/status")
  public ApiResponse<AdminUserResponse> updateStatus(
      @PathVariable UUID id, @Valid @RequestBody UserStatusRequest request, Principal principal) {
    return ApiResponse.success(adminUserService.updateStatus(id, request, principal.getName()));
  }
}
