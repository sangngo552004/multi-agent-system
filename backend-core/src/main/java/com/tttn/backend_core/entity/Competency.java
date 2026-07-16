package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "competencies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Competency {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, unique = true)
  private String name;

  @Column(nullable = false, length = 100)
  private String category; // HARD_SKILL, SOFT_SKILL, EXPERIENCE, PEDIGREE

  @Column(columnDefinition = "TEXT")
  private String description;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
