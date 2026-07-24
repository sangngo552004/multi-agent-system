package com.tttn.backend_core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "batch_jobs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchJob {

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "total_count", nullable = false)
  private int totalCount;

  @Column(name = "last_processed_index")
  @Builder.Default
  private int lastProcessedIndex = 0;

  @Column(name = "processed_count")
  @Builder.Default
  private int processedCount = 0;

  @Column(name = "success_count")
  @Builder.Default
  private int successCount = 0;

  @Column(name = "failed_count")
  @Builder.Default
  private int failedCount = 0;

  @Column(length = 20, nullable = false)
  private String status; // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> payload;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
