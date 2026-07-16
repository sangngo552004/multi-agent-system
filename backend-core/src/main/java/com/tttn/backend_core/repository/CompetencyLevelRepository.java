package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.CompetencyLevel;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompetencyLevelRepository extends JpaRepository<CompetencyLevel, UUID> {

  /** Lấy tất cả level của một competency, sắp xếp tăng dần. */
  List<CompetencyLevel> findByCompetencyIdOrderByLevelAsc(UUID competencyId);

  /** Lấy một bậc cụ thể để tra cứu label/description. */
  Optional<CompetencyLevel> findByCompetencyIdAndLevel(UUID competencyId, Integer level);
}
