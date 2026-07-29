package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.AiProcessedEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiProcessedEventRepository extends JpaRepository<AiProcessedEvent, String> {}
