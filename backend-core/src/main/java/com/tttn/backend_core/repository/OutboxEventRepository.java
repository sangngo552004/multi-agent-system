package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.OutboxEvent;
import java.util.List;
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
}
