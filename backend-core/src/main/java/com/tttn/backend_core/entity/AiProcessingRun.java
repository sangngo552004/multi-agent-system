package com.tttn.backend_core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "ai_processing_runs",
    uniqueConstraints = {
      @UniqueConstraint(columnNames = {"application_id", "attempt"}),
      @UniqueConstraint(columnNames = {"application_id", "idempotency_key"})
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProcessingRun {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "application_id", nullable = false)
  private Application application;

  @Column(nullable = false)
  private Integer attempt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AiProcessingStatus status;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private AiRunTrigger trigger;

  @Column(name = "idempotency_key", nullable = false, length = 120)
  private String idempotencyKey;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "requested_by")
  private User requestedBy;

  @CreationTimestamp
  @Column(name = "accepted_at", nullable = false, updatable = false)
  private LocalDateTime acceptedAt;

  @Column(name = "started_at")
  private LocalDateTime startedAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  @Column(name = "error_code", length = 80)
  private String errorCode;

  @Column(name = "error_message", columnDefinition = "TEXT")
  private String errorMessage;
}
