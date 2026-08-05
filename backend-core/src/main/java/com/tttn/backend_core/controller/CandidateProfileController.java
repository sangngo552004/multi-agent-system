package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.request.CandidateProfileUpdateRequest;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.CandidateProfileResponse;
import com.tttn.backend_core.service.CandidateProfileService;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/candidate/profile")
@RequiredArgsConstructor
public class CandidateProfileController {

  private final CandidateProfileService candidateProfileService;
  private final com.tttn.backend_core.repository.UserRepository userRepository;
  private final com.tttn.backend_core.service.ApplicationService applicationService;

  @GetMapping
  public ApiResponse<CandidateProfileResponse> getProfile(Principal principal) {
    return ApiResponse.success(candidateProfileService.getProfile(principal.getName()));
  }

  @PutMapping
  public ApiResponse<CandidateProfileResponse> updateProfile(
      Principal principal, @RequestBody CandidateProfileUpdateRequest request) {
    return ApiResponse.success(candidateProfileService.updateProfile(principal.getName(), request));
  }

  @PostMapping("/cv")
  @com.tttn.backend_core.annotation.RateLimit(
      action = "upload_master_cv",
      maxRequests = 100,
      duration = 1,
      unit = java.time.temporal.ChronoUnit.HOURS)
  public ApiResponse<Void> uploadMasterCv(
      Principal principal,
      @org.springframework.web.bind.annotation.RequestParam("cvFile")
          org.springframework.web.multipart.MultipartFile cvFile) {

    String contentType = cvFile.getContentType();
    String filename = cvFile.getOriginalFilename();
    if (contentType == null
        || !contentType.equals("application/pdf")
        || filename == null
        || !filename.toLowerCase().endsWith(".pdf")) {
      throw new com.tttn.backend_core.exception.AppException(
          com.tttn.backend_core.exception.ErrorCode.INVALID_FILE_FORMAT);
    }

    com.tttn.backend_core.entity.User user =
        userRepository
            .findByEmail(principal.getName())
            .orElseThrow(
                () ->
                    new com.tttn.backend_core.exception.AppException(
                        com.tttn.backend_core.exception.ErrorCode.USER_NOT_FOUND));

    candidateProfileService.processAndSaveMasterCv(user.getId(), cvFile);

    return ApiResponse.success(null);
  }
}
