package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.JobFilterRequest;
import com.tttn.backend_core.dto.request.JobRequest;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.entity.Job;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.mapper.JobMapper;
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
  private final JobMapper jobMapper;

  @Transactional(readOnly = true)
  public Page<JobResponse> getJobs(JobFilterRequest filter, Pageable pageable) {
    Page<Job> jobs = jobRepository.searchJobs(filter, pageable);
    return jobs.map(jobMapper::toResponse);
  }

  @Transactional(readOnly = true)
  public JobResponse getJobDetail(UUID id) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    return jobMapper.toResponse(job);
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
    return jobMapper.toResponse(savedJob);
  }

  @Transactional
  public JobResponse updateJob(UUID id, JobRequest request) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

    mapRequestToEntity(request, job);

    Job savedJob = jobRepository.save(job);
    return jobMapper.toResponse(savedJob);
  }

  @Transactional
  public void deleteJob(UUID id) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    job.setIsActive(false);
    jobRepository.save(job);
  }

  private void mapRequestToEntity(JobRequest request, Job job) {
    jobMapper.updateEntity(request, job);

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
}
