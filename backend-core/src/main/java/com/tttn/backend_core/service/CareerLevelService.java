package com.tttn.backend_core.service;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.tttn.backend_core.dto.request.MasterDataRequest;
import com.tttn.backend_core.entity.CareerLevel;
import com.tttn.backend_core.entity.QCareerLevel;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.CareerLevelRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CareerLevelService {
  private final CareerLevelRepository careerLevelRepository;

  @Transactional(readOnly = true)
  public Page<CareerLevel> findAll(Predicate predicate, Pageable pageable) {
    QCareerLevel q = QCareerLevel.careerLevel;
    Predicate activePredicate = q.isActive.eq(true);
    Predicate finalPredicate =
        predicate != null ? ExpressionUtils.allOf(predicate, activePredicate) : activePredicate;
    return careerLevelRepository.findAll(finalPredicate, pageable);
  }

  @Transactional
  public CareerLevel createCareerLevel(MasterDataRequest request) {
    CareerLevel entity = new CareerLevel();
    entity.setName(request.getName());
    entity.setDescription(request.getDescription());
    entity.setIsActive(true);
    return careerLevelRepository.save(entity);
  }

  @Transactional
  public CareerLevel updateCareerLevel(UUID id, MasterDataRequest request) {
    CareerLevel entity =
        careerLevelRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.CAREER_LEVEL_NOT_FOUND));
    if (!entity.getIsActive()) {
      throw new AppException(ErrorCode.CAREER_LEVEL_NOT_FOUND);
    }
    entity.setName(request.getName());
    entity.setDescription(request.getDescription());
    return careerLevelRepository.save(entity);
  }

  @Transactional
  public void deleteCareerLevel(UUID id) {
    CareerLevel entity =
        careerLevelRepository
            .findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.CAREER_LEVEL_NOT_FOUND));
    if (!entity.getIsActive()) {
      throw new AppException(ErrorCode.CAREER_LEVEL_NOT_FOUND);
    }
    entity.setIsActive(false);
    entity.setName(entity.getName() + " - deleted_" + System.currentTimeMillis());
    careerLevelRepository.save(entity);
  }
}
