package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.Job;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {}
