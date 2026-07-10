package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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

  @CreationTimestamp
  @Column(name = "applied_at", updatable = false)
  private LocalDateTime appliedAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
