package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.OutboxEvent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {

  // SKIP LOCKED query for highly concurrent Outbox Polling
  @Query(
      value =
          "SELECT * FROM outbox_events WHERE status = 'NEW' ORDER BY created_at ASC LIMIT 100 FOR UPDATE SKIP LOCKED",
      nativeQuery = true)
  List<OutboxEvent> findNewEventsForProcessing();

  Optional<OutboxEvent> findByBatchJobIdAndApplicationId(String batchJobId, String applicationId);

  @Query(
      value =
          "SELECT * FROM outbox_events WHERE status = 'PUBLISHED' AND created_at < :before ORDER BY created_at ASC LIMIT 100 FOR UPDATE SKIP LOCKED",
      nativeQuery = true)
  List<OutboxEvent> findPublishedEventsNeedingReplyRecovery(
      @org.springframework.data.repository.query.Param("before") java.time.LocalDateTime before);
}
