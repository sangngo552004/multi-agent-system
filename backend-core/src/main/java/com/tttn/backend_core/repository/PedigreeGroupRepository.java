package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.PedigreeGroup;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PedigreeGroupRepository extends JpaRepository<PedigreeGroup, UUID> {}
