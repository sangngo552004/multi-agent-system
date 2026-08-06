package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.ApplicationStatus;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CandidateApplicationResponse {
  private UUID id;
  private UUID jobId;
  private String jobTitle;
  private String resumeUrl;
  private ApplicationStatus status;
  private Map<String, Object> careerPathAdvice;
  private LocalDateTime appliedAt;
  private LocalDateTime updatedAt;
}
