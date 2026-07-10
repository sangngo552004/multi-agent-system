package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.Application;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {}
