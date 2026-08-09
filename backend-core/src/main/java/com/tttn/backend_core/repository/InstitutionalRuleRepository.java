package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.InstitutionalRule;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface InstitutionalRuleRepository
    extends JpaRepository<InstitutionalRule, UUID>, QuerydslPredicateExecutor<InstitutionalRule> {

  List<InstitutionalRule> findByIsActiveTrueOrderByNameAsc();
}
