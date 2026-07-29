package com.tttn.backend_core.repository.custom;

import com.tttn.backend_core.dto.request.JobFilterRequest;
import com.tttn.backend_core.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface JobRepositoryCustom {
  Page<Job> searchJobs(JobFilterRequest filter, Pageable pageable);
}
