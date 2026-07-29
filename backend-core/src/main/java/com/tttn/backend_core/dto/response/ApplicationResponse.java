package com.tttn.backend_core.dto.response;

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
  private String resumeUrl;
  private ApplicationStatus status;
  private Double fitScore;
  private String aiFeedback;
  private Map<String, Object> scoringBreakdown;
  private LocalDateTime appliedAt;
  private LocalDateTime updatedAt;
}
