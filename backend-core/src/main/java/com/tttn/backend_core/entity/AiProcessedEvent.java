package com.tttn.backend_core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "ai_processed_events")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProcessedEvent {

  @Id
  @Column(name = "event_id", length = 120)
  private String eventId;

  @Column(name = "run_id", nullable = false)
  private UUID runId;

  @CreationTimestamp
  @Column(name = "received_at", nullable = false, updatable = false)
  private LocalDateTime receivedAt;
}
