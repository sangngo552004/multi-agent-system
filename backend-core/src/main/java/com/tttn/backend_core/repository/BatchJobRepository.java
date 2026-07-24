package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.BatchJob;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BatchJobRepository extends JpaRepository<BatchJob, String> {
  List<BatchJob> findByStatusInAndUpdatedAtBefore(List<String> statuses, LocalDateTime time);
}
