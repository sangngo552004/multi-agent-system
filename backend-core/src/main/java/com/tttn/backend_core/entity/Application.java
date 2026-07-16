package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "candidate_id", nullable = false)
  private User candidate;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "job_id", nullable = false)
  private Job job;

  @Column(name = "resume_url", nullable = false)
  private String resumeUrl;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  @Builder.Default
  private ApplicationStatus status = ApplicationStatus.PENDING;

  @Column(name = "fit_score")
  private Double fitScore;

  @Column(name = "ai_feedback", columnDefinition = "TEXT")
  private String aiFeedback;

  /**
   * Breakdown điểm chi tiết từng competency và rule đã trigger. Cấu trúc JSON: {
   * "competency_scores": [{"id": ..., "name": ..., "earned": ..., "weight": ...}],
   * "rules_triggered": [{"rule_code": ..., "bonus_added": ...}], "rejection_reason": "..." }
   */
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "scoring_breakdown", columnDefinition = "jsonb")
  private Map<String, Object> scoringBreakdown;

  @CreationTimestamp
  @Column(name = "applied_at", updatable = false)
  private LocalDateTime appliedAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
