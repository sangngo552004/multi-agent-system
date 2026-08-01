package com.tttn.backend_core.controller;

import com.tttn.backend_core.annotation.RateLimit;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.dto.response.CandidateApplicationResponse;
import com.tttn.backend_core.entity.Application;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.UserRepository;
import com.tttn.backend_core.service.ApplicationService;
import java.security.Principal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/candidate/applications")
@RequiredArgsConstructor
public class CandidateApplicationController {

  private final ApplicationService applicationService;
  private final ApplicationRepository applicationRepository;
  private final UserRepository userRepository;

  @PostMapping("/jobs/{jobId}/apply")
  @RateLimit(action = "apply_job", maxRequests = 5, duration = 10, unit = ChronoUnit.MINUTES)
  public ApiResponse<CandidateApplicationResponse> applyForJob(
      @PathVariable UUID jobId, @RequestParam("cvFile") MultipartFile cvFile, Principal principal) {

    String contentType = cvFile.getContentType();
    String filename = cvFile.getOriginalFilename();
    if (contentType == null
        || !contentType.equals("application/pdf")
        || filename == null
        || !filename.toLowerCase().endsWith(".pdf")) {
      throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
    }

    com.tttn.backend_core.entity.User user =
        userRepository
            .findByEmail(principal.getName())
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    com.tttn.backend_core.dto.response.ApplicationResponse appResponse =
        applicationService.applyForJob(jobId, user.getId(), cvFile);

    return ApiResponse.success(
        CandidateApplicationResponse.builder()
            .id(appResponse.getId())
            .jobId(jobId)
            // jobTitle can be mapped later or fetched
            .resumeUrl(appResponse.getResumeUrl())
            .status(ApplicationStatus.PENDING)
            .appliedAt(appResponse.getAppliedAt())
            .updatedAt(appResponse.getUpdatedAt())
            .build());
  }

  @GetMapping
  public ApiResponse<List<CandidateApplicationResponse>> getMyApplications(Principal principal) {
    com.tttn.backend_core.entity.User user =
        userRepository
            .findByEmail(principal.getName())
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    // Get all applications for this candidate
    List<Application> applications =
        applicationRepository.findAll(
            (root, query, cb) -> cb.equal(root.get("candidate").get("id"), user.getId()));

    List<CandidateApplicationResponse> responses =
        applications.stream()
            .map(
                app -> {
                  ApplicationStatus displayStatus = ApplicationStatus.PENDING;
                  Map<String, Object> careerPathAdvice = null;

                  if (Boolean.TRUE.equals(app.getIsCandidateNotified())) {
                    displayStatus = app.getStatus();

                    if (displayStatus == ApplicationStatus.REJECTED
                        || displayStatus == ApplicationStatus.REJECTED_FINAL) {
                      if (app.getScoringBreakdown() != null
                          && app.getScoringBreakdown().containsKey("career_path_result")) {
                        careerPathAdvice =
                            (Map<String, Object>)
                                app.getScoringBreakdown().get("career_path_result");
                      }
                    }
                  }

                  return CandidateApplicationResponse.builder()
                      .id(app.getId())
                      .jobId(app.getJob().getId())
                      .jobTitle(app.getJob().getTitle())
                      .resumeUrl(app.getResumeUrl())
                      .status(displayStatus)
                      .careerPathAdvice(careerPathAdvice)
                      .appliedAt(app.getAppliedAt())
                      .updatedAt(app.getUpdatedAt())
                      .build();
                })
            .collect(Collectors.toList());

    return ApiResponse.success(responses);
  }
}
