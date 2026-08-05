package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.CandidateProfileUpdateRequest;
import com.tttn.backend_core.dto.response.CandidateProfileResponse;
import com.tttn.backend_core.entity.CandidateProfile;
import com.tttn.backend_core.entity.User;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.CandidateProfileRepository;
import com.tttn.backend_core.repository.UserRepository;
import java.util.HashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CandidateProfileService {

  private final UserRepository userRepository;
  private final CandidateProfileRepository candidateProfileRepository;

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
        .skills(profile.getSkills() != null ? profile.getSkills() : new HashMap<>())
        .experience(profile.getExperience() != null ? profile.getExperience() : new HashMap<>())
        .education(profile.getEducation() != null ? profile.getEducation() : new HashMap<>())
        .build();
  }
}
