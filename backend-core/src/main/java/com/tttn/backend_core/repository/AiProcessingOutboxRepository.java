package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.AiProcessingOutbox;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AiProcessingOutboxRepository extends JpaRepository<AiProcessingOutbox, UUID> {

  @Query(
      value =
          "SELECT * FROM ai_processing_outbox WHERE status = 'NEW' "
              + "ORDER BY created_at ASC LIMIT 50 FOR UPDATE SKIP LOCKED",
      nativeQuery = true)
  List<AiProcessingOutbox> findNewForPublishing();
}
