package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.CareerLevel;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CareerLevelRepository extends JpaRepository<CareerLevel, UUID> {
  List<CareerLevel> findAllByOrderByRankValueAsc();

  List<CareerLevel> findByIsActiveTrueOrderByRankValueAsc();

  @Query(
      "select count(cl) > 0 from CareerLevel cl "
          + "where lower(cl.name) = lower(:name) and (:excludedId is null or cl.id <> :excludedId)")
  boolean existsNormalizedName(@Param("name") String name, @Param("excludedId") UUID excludedId);

  @Query(
      "select count(cl) > 0 from CareerLevel cl "
          + "where cl.rankValue = :rankValue and (:excludedId is null or cl.id <> :excludedId)")
  boolean existsRankValue(
      @Param("rankValue") Integer rankValue, @Param("excludedId") UUID excludedId);
}
