package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.Competency;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CompetencyRepository
    extends JpaRepository<Competency, UUID>, QuerydslPredicateExecutor<Competency> {

  List<Competency> findAllByOrderByNameAsc();

  List<Competency> findByIsActiveTrueOrderByNameAsc();

  @Query(
      "select count(c) > 0 from Competency c "
          + "where lower(c.name) = lower(:name) and (:excludedId is null or c.id <> :excludedId)")
  boolean existsNormalizedName(@Param("name") String name, @Param("excludedId") UUID excludedId);
}
