package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.CareerLevel;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CareerLevelRepository
    extends JpaRepository<CareerLevel, UUID>, QuerydslPredicateExecutor<CareerLevel> {}
