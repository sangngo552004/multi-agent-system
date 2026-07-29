package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.Job;
import com.tttn.backend_core.repository.custom.JobRepositoryCustom;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JobRepository
    extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job>, JobRepositoryCustom {

  @EntityGraph(
      attributePaths = {
        "hr",
        "jobFamily",
        "careerLevel",
        "requiredCompetencies",
        "requiredCompetencies.competency"
      })
  @Query("select distinct j from Job j where j.id in :ids")
  List<Job> findAdminJobsByIds(@Param("ids") List<UUID> ids);

  @EntityGraph(
      attributePaths = {
        "hr",
        "jobFamily",
        "careerLevel",
        "requiredCompetencies",
        "requiredCompetencies.competency"
      })
  @Query("select distinct j from Job j where j.id = :id")
  Optional<Job> findAdminJobById(@Param("id") UUID id);

  @Query("select j.hr.id, count(j) from Job j where j.hr.id in :userIds group by j.hr.id")
  List<Object[]> countByHrIds(@Param("userIds") List<UUID> userIds);

  @Query(
      "select j.jobFamily.id, count(j) from Job j "
          + "where j.jobFamily.id in :ids group by j.jobFamily.id")
  List<Object[]> countByJobFamilyIds(@Param("ids") List<UUID> ids);

  @Query(
      "select j.careerLevel.id, count(j) from Job j "
          + "where j.careerLevel.id in :ids group by j.careerLevel.id")
  List<Object[]> countByCareerLevelIds(@Param("ids") List<UUID> ids);
}
