package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.request.CandidateProfileUpdateRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.CandidateProfileResponse;
import com.tttn.backend_core.service.CandidateProfileService;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/candidate/profile")
@RequiredArgsConstructor
public class CandidateProfileController {

  private final CandidateProfileService candidateProfileService;

  @GetMapping
  public ApiResponse<CandidateProfileResponse> getProfile(Principal principal) {
    return ApiResponse.success(candidateProfileService.getProfile(principal.getName()));
  }

  @PutMapping
  public ApiResponse<CandidateProfileResponse> updateProfile(
      Principal principal, @RequestBody CandidateProfileUpdateRequest request) {
    return ApiResponse.success(candidateProfileService.updateProfile(principal.getName(), request));
  }
}
