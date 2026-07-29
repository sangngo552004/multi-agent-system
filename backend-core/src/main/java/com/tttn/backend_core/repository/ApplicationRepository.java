package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.AiProcessingStatus;
import com.tttn.backend_core.entity.Application;
import com.tttn.backend_core.entity.ApplicationStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationRepository
    extends JpaRepository<Application, UUID>, JpaSpecificationExecutor<Application> {

  interface AiStatusCountProjection {
    AiProcessingStatus getStatus();

    long getTotal();
  }

  interface DailyApplicationCountProjection {
    int getYearValue();

    int getMonthValue();

    int getDayValue();

    long getTotal();
  }

  @Modifying
  @Query(
      "UPDATE Application a SET a.status = :newStatus WHERE a.id IN :ids AND a.status = :oldStatus")
  int updateStatusConditionally(
      @Param("ids") List<UUID> ids,
      @Param("oldStatus") ApplicationStatus oldStatus,
      @Param("newStatus") ApplicationStatus newStatus);

  @Modifying
  @Query("UPDATE Application a SET a.status = :status WHERE a.id IN :ids")
  int updateStatusBatch(@Param("ids") List<UUID> ids, @Param("status") ApplicationStatus status);

  @Query(
      "select a.candidate.id, count(a) from Application a "
          + "where a.candidate.id in :userIds group by a.candidate.id")
  List<Object[]> countByCandidateIds(@Param("userIds") List<UUID> userIds);

  @Query("select a.job.id, count(a) from Application a where a.job.id in :jobIds group by a.job.id")
  List<Object[]> countByJobIds(@Param("jobIds") List<UUID> jobIds);

  @Query(
      "select a.aiStatus as status, count(a) as total from Application a "
          + "where a.job.id = :jobId group by a.aiStatus")
  List<AiStatusCountProjection> countByAiStatusForJob(@Param("jobId") UUID jobId);

  @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"candidate", "job"})
  @Query("select a from Application a where a.id in :ids")
  List<Application> findAdminApplicationsByIds(@Param("ids") List<UUID> ids);

  @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"candidate", "job"})
  @Query("select a from Application a where a.id = :id")
  java.util.Optional<Application> findAdminApplicationById(@Param("id") UUID id);

  @Query(
      "select a.aiStatus as status, count(a) as total from Application a "
          + "where a.appliedAt >= :fromInclusive and a.appliedAt < :toExclusive "
          + "group by a.aiStatus")
  List<AiStatusCountProjection> countByAiStatusBetween(
      @Param("fromInclusive") LocalDateTime fromInclusive,
      @Param("toExclusive") LocalDateTime toExclusive);

  @Query(
      "select year(a.appliedAt) as yearValue, month(a.appliedAt) as monthValue, "
          + "day(a.appliedAt) as dayValue, count(a) as total from Application a "
          + "where a.appliedAt >= :fromInclusive and a.appliedAt < :toExclusive "
          + "group by year(a.appliedAt), month(a.appliedAt), day(a.appliedAt) "
          + "order by year(a.appliedAt), month(a.appliedAt), day(a.appliedAt)")
  List<DailyApplicationCountProjection> countApplicationsByDay(
      @Param("fromInclusive") LocalDateTime fromInclusive,
      @Param("toExclusive") LocalDateTime toExclusive);
}
