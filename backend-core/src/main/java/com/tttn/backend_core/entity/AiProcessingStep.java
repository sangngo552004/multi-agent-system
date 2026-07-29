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

@Entity
@Table(
    name = "ai_processing_steps",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"run_id", "step_name"})})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProcessingStep {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "run_id", nullable = false)
  private AiProcessingRun run;

  @Enumerated(EnumType.STRING)
  @Column(name = "step_name", nullable = false, length = 30)
  private AiStepName stepName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AiStepStatus status;

  @Column(nullable = false, length = 500)
  private String message;

  @Column(name = "started_at")
  private LocalDateTime startedAt;

  @Column(name = "finished_at")
  private LocalDateTime finishedAt;
}
