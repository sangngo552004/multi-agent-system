package com.tttn.backend_core.dto.request;

import com.tttn.backend_core.entity.ApplicationStatus;
import lombok.Data;

@Data
public class ApplicationFilterRequest {
  private ApplicationStatus status;
  private Double minFitScore;
  private Double maxFitScore;
  private String keyword; // For candidate name or email search
}
