package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "full_name")
  private String fullName;

  @Column(name = "employee_code", length = 100)
  private String employeeCode;

  @Column(name = "department_name")
  private String departmentName;

  @Column(name = "job_title")
  private String jobTitle;

  @Column(name = "work_location")
  private String workLocation;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @Builder.Default
  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @Column(name = "last_active_at")
  private LocalDateTime lastActiveAt;

  @Column(name = "block_reason", length = 240)
  private String blockReason;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
