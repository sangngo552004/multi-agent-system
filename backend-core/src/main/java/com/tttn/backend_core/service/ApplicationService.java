package com.tttn.backend_core.service;

import com.tttn.backend_core.entity.Application;
import com.tttn.backend_core.entity.ApplicationStatus;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.ApplicationRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationService {

  private final ApplicationRepository applicationRepository;

  @Transactional
  public void approveApplication(UUID id) {
    Application application =
        applicationRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

    application.setStatus(ApplicationStatus.SHORTLISTED);
    applicationRepository.save(application);
    log.info("Application {} approved (Status -> SHORTLISTED)", id);
  }

  @Transactional
  public void rejectApplication(UUID id) {
    Application application =
        applicationRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

    application.setStatus(ApplicationStatus.REJECTED);
    applicationRepository.save(application);
    log.info("Application {} rejected (Status -> REJECTED)", id);
  }
}
