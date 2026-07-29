package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.JobCompetency;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JobCompetencyRepository extends JpaRepository<JobCompetency, UUID> {

  @Query(
      "select jc.competency.id, count(jc) from JobCompetency jc "
          + "where jc.competency.id in :ids group by jc.competency.id")
  List<Object[]> countByCompetencyIds(@Param("ids") List<UUID> ids);
}
