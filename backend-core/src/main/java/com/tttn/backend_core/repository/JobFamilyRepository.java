package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.JobFamily;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JobFamilyRepository extends JpaRepository<JobFamily, UUID> {
  List<JobFamily> findAllByOrderByNameAsc();

  List<JobFamily> findByIsActiveTrueOrderByNameAsc();

  @Query(
      "select count(jf) > 0 from JobFamily jf "
          + "where lower(jf.name) = lower(:name) and (:excludedId is null or jf.id <> :excludedId)")
  boolean existsNormalizedName(@Param("name") String name, @Param("excludedId") UUID excludedId);
}
