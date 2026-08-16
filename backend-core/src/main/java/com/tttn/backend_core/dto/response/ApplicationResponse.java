package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.AiProcessingStatus;
import com.tttn.backend_core.entity.ApplicationStatus;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApplicationResponse {
  private UUID id;
  private UUID candidateId;
  private String candidateName;
  private String candidateEmail;
  private UUID jobId;
  private String jobTitle;
  private String jobLocation;
  private String departmentName;
  private String resumeUrl;
  private ApplicationStatus status;
  private AiProcessingStatus aiStatus;
  private Double fitScore;
  private Double aiConfidence;
  private Boolean needsReview;
  private String aiErrorCode;
  private String aiErrorMessage;
  private String aiFeedback;
  private Map<String, Object> scoringBreakdown;
  private boolean careerPathReady;
  private boolean careerPathNotApplicable;
  private LocalDateTime appliedAt;
  private LocalDateTime updatedAt;
}
