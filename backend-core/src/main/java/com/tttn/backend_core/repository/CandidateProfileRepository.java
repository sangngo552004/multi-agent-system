package com.tttn.backend_core.repository;

import com.tttn.backend_core.entity.CandidateProfile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, UUID> {}
