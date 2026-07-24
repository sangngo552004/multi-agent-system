package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.Application;
import com.tttn.backend_core.entity.ApplicationStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {

  @Modifying
  @Query(
      "UPDATE Application a SET a.status = :newStatus WHERE a.id IN :ids AND a.status = :oldStatus")
  int updateStatusConditionally(
      @Param("ids") List<UUID> ids,
      @Param("oldStatus") ApplicationStatus oldStatus,
      @Param("newStatus") ApplicationStatus newStatus);
}
