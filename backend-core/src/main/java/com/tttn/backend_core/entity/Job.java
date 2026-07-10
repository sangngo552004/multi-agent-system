package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "hr_id", nullable = false)
  private User hr;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String location;

  @Enumerated(EnumType.STRING)
  @Column(name = "employment_type", nullable = false)
  private EmploymentType employmentType;

  @Column(columnDefinition = "TEXT", nullable = false)
  private String description;

  @Column(columnDefinition = "TEXT", nullable = false)
  private String requirements;

  @Column(columnDefinition = "TEXT")
  private String benefits;

  @Column(name = "is_active", nullable = false)
  @Builder.Default
  private Boolean isActive = true;

  @Column(name = "expired_at")
  private LocalDateTime expiredAt;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
