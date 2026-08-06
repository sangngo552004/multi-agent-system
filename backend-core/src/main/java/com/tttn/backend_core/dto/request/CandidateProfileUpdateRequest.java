package com.tttn.backend_core.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfileUpdateRequest {
  private String fullName;
  private java.util.Map<String, Object> profileData;
}
