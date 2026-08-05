package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.CandidateProfileUpdateRequest;
import com.tttn.backend_core.dto.response.CandidateProfileResponse;
import com.tttn.backend_core.entity.CandidateProfile;
import com.tttn.backend_core.entity.User;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.CandidateProfileRepository;
import com.tttn.backend_core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CandidateProfileService {

  private final UserRepository userRepository;
  private final CandidateProfileRepository candidateProfileRepository;
  private final AiParsingService aiParsingService;
  private final StorageService storageService;

  @Transactional
  public void processAndSaveMasterCv(
      java.util.UUID userId, org.springframework.web.multipart.MultipartFile file) {
    String fileUrl = storageService.uploadFile(file);
    com.fasterxml.jackson.databind.JsonNode cvData = aiParsingService.extractCv(file);

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    CandidateProfile profile =
        candidateProfileRepository
            .findById(userId)
            .orElseGet(() -> CandidateProfile.builder().userId(userId).user(user).build());

    profile.setCvUrl(fileUrl);

    com.fasterxml.jackson.databind.ObjectMapper mapper =
        new com.fasterxml.jackson.databind.ObjectMapper();
    try {
      java.util.Map<String, Object> rawMap =
          mapper.convertValue(
              cvData,
              new com.fasterxml.jackson.core.type.TypeReference<
                  java.util.Map<String, Object>>() {});
      profile.setRawCvData(rawMap);
    } catch (Exception e) {
      // Ignored if map fails
    }

    if (cvData.has("skills") && !cvData.get("skills").isNull()) {
      profile.setSkills(
          mapper.convertValue(
              cvData.get("skills"),
              new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {}));
    }
    if (cvData.has("experience") && !cvData.get("experience").isNull()) {
      profile.setExperience(
          mapper.convertValue(
              cvData.get("experience"),
              new com.fasterxml.jackson.core.type.TypeReference<
                  java.util.List<java.util.Map<String, Object>>>() {}));
    }
    if (cvData.has("education") && !cvData.get("education").isNull()) {
      profile.setEducation(
          mapper.convertValue(
              cvData.get("education"),
              new com.fasterxml.jackson.core.type.TypeReference<
                  java.util.List<java.util.Map<String, Object>>>() {}));
    }

    candidateProfileRepository.save(profile);
  }

  @Transactional(readOnly = true)
  public CandidateProfileResponse getProfile(String email) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    CandidateProfile profile =
        candidateProfileRepository
            .findById(user.getId())
            .orElseGet(() -> CandidateProfile.builder().userId(user.getId()).user(user).build());

    return mapToResponse(user, profile);
  }

  @Transactional
  public CandidateProfileResponse updateProfile(
      String email, CandidateProfileUpdateRequest request) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    CandidateProfile profile =
        candidateProfileRepository
            .findById(user.getId())
            .orElseGet(() -> CandidateProfile.builder().userId(user.getId()).user(user).build());

    if (request.getSkills() != null) {
      profile.setSkills(request.getSkills());
    }
    if (request.getExperience() != null) {
      profile.setExperience(request.getExperience());
    }
    if (request.getEducation() != null) {
      profile.setEducation(request.getEducation());
    }

    CandidateProfile savedProfile = candidateProfileRepository.save(profile);
    return mapToResponse(user, savedProfile);
  }

  private CandidateProfileResponse mapToResponse(User user, CandidateProfile profile) {
    return CandidateProfileResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .skills(profile.getSkills() != null ? profile.getSkills() : new java.util.ArrayList<>())
        .experience(
            profile.getExperience() != null ? profile.getExperience() : new java.util.ArrayList<>())
        .education(
            profile.getEducation() != null ? profile.getEducation() : new java.util.ArrayList<>())
        .build();
  }
}
