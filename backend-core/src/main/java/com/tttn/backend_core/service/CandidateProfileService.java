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
            .orElseGet(() -> CandidateProfile.builder().user(user).build());

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
      profile.setProfileData(profileDataFromCv(rawMap));
      updateUserNameFromCv(user, rawMap);
    } catch (Exception e) {
      // Ignored if map fails
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
            .orElseGet(() -> CandidateProfile.builder().user(user).build());

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
            .orElseGet(() -> CandidateProfile.builder().user(user).build());

    if (request.getProfileData() != null) {
      profile.setProfileData(request.getProfileData());
    }
    if (request.getFullName() != null && !request.getFullName().isBlank()) {
      user.setFullName(request.getFullName().trim());
    }

    CandidateProfile savedProfile = candidateProfileRepository.save(profile);
    return mapToResponse(user, savedProfile);
  }

  private CandidateProfileResponse mapToResponse(User user, CandidateProfile profile) {
    return CandidateProfileResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .cvUrl(profile.getCvUrl())
        .profileData(
            profile.getProfileData() != null ? profile.getProfileData() : new java.util.HashMap<>())
        .build();
  }

  private java.util.Map<String, Object> profileDataFromCv(java.util.Map<String, Object> rawCvData) {
    java.util.Map<String, Object> profileData = new java.util.LinkedHashMap<>();
    java.util.List<String> profileFields =
        java.util.List.of(
            "personal_info",
            "social_links",
            "professional_metadata",
            "skills",
            "experience",
            "education",
            "projects",
            "spoken_languages",
            "certifications");
    profileFields.forEach(
        field -> {
          if (rawCvData.containsKey(field)) {
            profileData.put(field, rawCvData.get(field));
          }
        });
    return profileData;
  }

  @SuppressWarnings("unchecked")
  private void updateUserNameFromCv(User user, java.util.Map<String, Object> rawCvData) {
    Object personalInfo = rawCvData.get("personal_info");
    if (!(personalInfo instanceof java.util.Map<?, ?> personalInfoMap)) {
      return;
    }
    Object name = personalInfoMap.get("name");
    if (name instanceof String fullName && !fullName.isBlank()) {
      user.setFullName(fullName.trim());
    }
  }
}
