package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.ActivityLog;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityLogRepository
    extends JpaRepository<ActivityLog, UUID>, JpaSpecificationExecutor<ActivityLog> {}
