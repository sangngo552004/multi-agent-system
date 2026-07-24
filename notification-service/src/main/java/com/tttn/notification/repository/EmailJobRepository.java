package com.tttn.notification.repository;

import com.tttn.notification.entity.EmailJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailJobRepository extends JpaRepository<EmailJob, String> {
}
