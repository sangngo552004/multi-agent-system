package com.tttn.backend_core.dto.response;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfileResponse {
  private UUID userId;
  private String email;
  private String fullName;
  private String cvUrl;
  private java.util.Map<String, Object> profileData;
}
