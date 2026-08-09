package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "pedigree_entity_aliases",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"normalized_alias"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedigreeEntityAlias {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "pedigree_entity_id", nullable = false)
  private PedigreeEntity pedigreeEntity;

  @Column(nullable = false, length = 255)
  private String alias;

  @Column(name = "normalized_alias", nullable = false, length = 255)
  private String normalizedAlias;
}
