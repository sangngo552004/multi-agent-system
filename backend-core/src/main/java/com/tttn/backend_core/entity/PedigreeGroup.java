package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;

/** A reusable, HR-managed set of organizations eligible for a bonus rule. */
@Entity
@Table(name = "pedigree_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedigreeGroup {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, unique = true, length = 100)
  private String code;

  @Column(nullable = false, length = 255)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(name = "evidence_source", nullable = false, length = 40)
  private InstitutionalEvidenceSource evidenceSource;

  @Column(name = "is_active", nullable = false)
  @Builder.Default
  private Boolean isActive = true;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "pedigree_group_members",
      joinColumns = @JoinColumn(name = "group_id"),
      inverseJoinColumns = @JoinColumn(name = "pedigree_entity_id"))
  @Builder.Default
  private List<PedigreeEntity> members = new ArrayList<>();
}
