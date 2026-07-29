package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.JobFilterRequest;
import com.tttn.backend_core.dto.request.JobRequest;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.entity.Job;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.repository.CareerLevelRepository;
import com.tttn.backend_core.repository.JobFamilyRepository;
import com.tttn.backend_core.repository.JobRepository;
import com.tttn.backend_core.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JobService {

  private final JobRepository jobRepository;
  private final JobFamilyRepository jobFamilyRepository;
  private final CareerLevelRepository careerLevelRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public Page<JobResponse> getJobs(JobFilterRequest filter, Pageable pageable) {
    Page<Job> jobs = jobRepository.searchJobs(filter, pageable);
    return jobs.map(this::mapToResponse);
  }

  @Transactional(readOnly = true)
  public JobResponse getJobDetail(UUID id) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    return mapToResponse(job);
  }

  @Transactional
  public JobResponse createJob(UUID hrId, JobRequest request) {
    Job job = new Job();

    job.setHr(
        userRepository
            .findById(hrId)
            .orElseThrow(() -> new AppException(ErrorCode.HR_USER_NOT_FOUND)));

    mapRequestToEntity(request, job);

    Job savedJob = jobRepository.save(job);
    return mapToResponse(savedJob);
  }

  @Transactional
  public JobResponse updateJob(UUID id, JobRequest request) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

    mapRequestToEntity(request, job);

    Job savedJob = jobRepository.save(job);
    return mapToResponse(savedJob);
  }

  @Transactional
  public void deleteJob(UUID id) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    job.setIsActive(false);
    jobRepository.save(job);
  }

  private void mapRequestToEntity(JobRequest request, Job job) {
    job.setTitle(request.getTitle());
    job.setLocation(request.getLocation());
    job.setEmploymentType(request.getEmploymentType());
    job.setDescription(request.getDescription());
    job.setRequirements(request.getRequirements());
    job.setBenefits(request.getBenefits());

    if (request.getIsActive() != null) {
      job.setIsActive(request.getIsActive());
    }

    if (request.getExpiredAt() != null) {
      job.setExpiredAt(request.getExpiredAt());
    }

    if (request.getJobFamilyId() != null) {
      job.setJobFamily(
          jobFamilyRepository
              .findById(request.getJobFamilyId())
              .orElseThrow(() -> new AppException(ErrorCode.JOB_FAMILY_NOT_FOUND)));
    } else {
      job.setJobFamily(null);
    }

    if (request.getCareerLevelId() != null) {
      job.setCareerLevel(
          careerLevelRepository
              .findById(request.getCareerLevelId())
              .orElseThrow(() -> new AppException(ErrorCode.CAREER_LEVEL_NOT_FOUND)));
    } else {
      job.setCareerLevel(null);
    }
  }

  private JobResponse mapToResponse(Job job) {
    JobResponse response = new JobResponse();
    response.setId(job.getId());
    response.setTitle(job.getTitle());
    response.setLocation(job.getLocation());
    response.setEmploymentType(job.getEmploymentType());
    response.setDescription(job.getDescription());
    response.setRequirements(job.getRequirements());
    response.setBenefits(job.getBenefits());
    response.setIsActive(job.getIsActive());
    response.setExpiredAt(job.getExpiredAt());
    response.setCreatedAt(job.getCreatedAt());
    response.setUpdatedAt(job.getUpdatedAt());

    if (job.getJobFamily() != null) {
      response.setJobFamilyId(job.getJobFamily().getId());
      response.setJobFamilyName(job.getJobFamily().getName());
    }

    if (job.getCareerLevel() != null) {
      response.setCareerLevelId(job.getCareerLevel().getId());
      response.setCareerLevelName(job.getCareerLevel().getName());
    }

    return response;
  }
}
