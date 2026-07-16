package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.PedigreeEntity;
import com.tttn.backend_core.entity.PedigreeRank;
import com.tttn.backend_core.entity.PedigreeType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PedigreeRepository extends JpaRepository<PedigreeEntity, UUID> {

  List<PedigreeEntity> findByIsActiveTrueOrderByRankAscNameAsc();

  List<PedigreeEntity> findByTypeAndIsActiveTrue(PedigreeType type);

  List<PedigreeEntity> findByTypeAndRankAndIsActiveTrue(PedigreeType type, PedigreeRank rank);

  boolean existsByNameIgnoreCase(String name);
}
