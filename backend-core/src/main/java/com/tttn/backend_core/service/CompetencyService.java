package com.tttn.backend_core.service;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.entity.QCompetency;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.CompetencyRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompetencyService {
  private final CompetencyRepository competencyRepository;

  @Transactional(readOnly = true)
  public Page<Competency> findAll(Predicate predicate, Pageable pageable) {
    QCompetency q = QCompetency.competency;
    Predicate activePredicate = q.isActive.eq(true);
    Predicate finalPredicate =
        predicate != null ? ExpressionUtils.allOf(predicate, activePredicate) : activePredicate;
    return competencyRepository.findAll(finalPredicate, pageable);
  }

  @Transactional
  public Competency createCompetency(MasterDataRequest request) {
    Competency competency = new Competency();
    competency.setName(request.getName());
    competency.setDescription(request.getDescription());
    competency.setIsActive(true);
    return competencyRepository.save(competency);
  }

  @Transactional
  public Competency updateCompetency(UUID id, MasterDataRequest request) {
    Competency competency =
        competencyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.COMPETENCY_NOT_FOUND));
    if (!competency.getIsActive()) {
      throw new AppException(ErrorCode.COMPETENCY_NOT_FOUND);
    }
    competency.setName(request.getName());
    competency.setDescription(request.getDescription());
    return competencyRepository.save(competency);
  }

  @Transactional
  public void deleteCompetency(UUID id) {
    Competency competency =
        competencyRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.COMPETENCY_NOT_FOUND));
    if (!competency.getIsActive()) {
      throw new AppException(ErrorCode.COMPETENCY_NOT_FOUND);
    }
    competency.setIsActive(false);
    competency.setName(competency.getName() + " - deleted_" + System.currentTimeMillis());
    competencyRepository.save(competency);
  }
}
