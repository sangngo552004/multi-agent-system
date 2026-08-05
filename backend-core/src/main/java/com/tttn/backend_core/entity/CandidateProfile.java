package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.util.Map;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "candidate_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateProfile {

  @Id private UUID userId;

  @OneToOne
  @MapsId
  @JoinColumn(name = "user_id")
  private User user;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "json")
  private java.util.List<String> skills;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "json")
  private java.util.List<Map<String, Object>> experience;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "json")
  private java.util.List<Map<String, Object>> education;

  @Column(name = "cv_url")
  private String cvUrl;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "raw_cv_data", columnDefinition = "json")
  private Map<String, Object> rawCvData;
}
