package com.tttn.backend_core.service;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.entity.JobFamily;
import com.tttn.backend_core.entity.QJobFamily;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.JobFamilyRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JobFamilyService {
  private final JobFamilyRepository jobFamilyRepository;

  @Transactional(readOnly = true)
  public Page<JobFamily> findAll(Predicate predicate, Pageable pageable) {
    QJobFamily q = QJobFamily.jobFamily;
    Predicate activePredicate = q.isActive.eq(true);
    Predicate finalPredicate =
        predicate != null ? ExpressionUtils.allOf(predicate, activePredicate) : activePredicate;
    return jobFamilyRepository.findAll(finalPredicate, pageable);
  }

  @Transactional
  public JobFamily createJobFamily(MasterDataRequest request) {
    JobFamily entity = new JobFamily();
    entity.setName(request.getName());
    entity.setDescription(request.getDescription());
    entity.setIsActive(true);
    return jobFamilyRepository.save(entity);
  }

  @Transactional
  public JobFamily updateJobFamily(UUID id, MasterDataRequest request) {
    JobFamily entity =
        jobFamilyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.JOB_FAMILY_NOT_FOUND));
    if (!entity.getIsActive()) {
      throw new AppException(ErrorCode.JOB_FAMILY_NOT_FOUND);
    }
    entity.setName(request.getName());
    entity.setDescription(request.getDescription());
    return jobFamilyRepository.save(entity);
  }

  @Transactional
  public void deleteJobFamily(UUID id) {
    JobFamily entity =
        jobFamilyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.JOB_FAMILY_NOT_FOUND));
    if (!entity.getIsActive()) {
      throw new AppException(ErrorCode.JOB_FAMILY_NOT_FOUND);
    }
    entity.setIsActive(false);
    entity.setName(entity.getName() + " - deleted_" + System.currentTimeMillis());
    jobFamilyRepository.save(entity);
  }
}
