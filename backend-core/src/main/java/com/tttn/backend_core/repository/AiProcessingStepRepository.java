package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.AiProcessingStep;
import com.tttn.backend_core.entity.AiStepName;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiProcessingStepRepository extends JpaRepository<AiProcessingStep, UUID> {
  List<AiProcessingStep> findByRun_IdOrderByStepNameAsc(UUID runId);

  Optional<AiProcessingStep> findByRun_IdAndStepName(UUID runId, AiStepName stepName);
}
