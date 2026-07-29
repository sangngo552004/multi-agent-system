package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.Competency;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CompetencyRepository
    extends JpaRepository<Competency, UUID>, QuerydslPredicateExecutor<Competency> {}
