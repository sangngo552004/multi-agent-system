package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.AiProcessingRun;
import com.tttn.backend_core.entity.AiProcessingStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AiProcessingRunRepository extends JpaRepository<AiProcessingRun, UUID> {

  Optional<AiProcessingRun> findTopByApplication_IdOrderByAttemptDesc(UUID applicationId);

  Optional<AiProcessingRun> findByApplication_IdAndIdempotencyKey(
      UUID applicationId, String idempotencyKey);

  boolean existsByApplication_IdAndStatusIn(
      UUID applicationId, Collection<AiProcessingStatus> statuses);

  @Query(
      "select r from AiProcessingRun r where r.application.id in :applicationIds "
          + "and r.attempt = (select max(latest.attempt) from AiProcessingRun latest "
          + "where latest.application.id = r.application.id)")
  List<AiProcessingRun> findLatestByApplicationIds(
      @Param("applicationIds") List<UUID> applicationIds);
}
