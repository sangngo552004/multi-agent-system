package com.tttn.backend_core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tttn.backend_core.dto.request.JobCompetencyRequest;
import com.tttn.backend_core.dto.request.JobFilterRequest;
import com.tttn.backend_core.dto.request.JobRequest;
import com.tttn.backend_core.dto.request.JobRuleUpdateRequest;
import com.tttn.backend_core.dto.response.JobResponse;
import com.tttn.backend_core.entity.Competency;
import com.tttn.backend_core.entity.InstitutionalRule;
import com.tttn.backend_core.entity.Job;
import com.tttn.backend_core.entity.JobCompetency;
import com.tttn.backend_core.entity.JobStatus;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import com.tttn.backend_core.mapper.JobMapper;
import com.tttn.backend_core.repository.ApplicationRepository;
import com.tttn.backend_core.repository.CareerLevelRepository;
import com.tttn.backend_core.repository.CompetencyRepository;
import com.tttn.backend_core.repository.InstitutionalRuleRepository;
import com.tttn.backend_core.repository.JobFamilyRepository;
import com.tttn.backend_core.repository.JobRepository;
import com.tttn.backend_core.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
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
  private final CompetencyRepository competencyRepository;
  private final InstitutionalRuleRepository institutionalRuleRepository;
  private final ApplicationRepository applicationRepository;
  private final JobMapper jobMapper;
  private final ObjectMapper objectMapper;

  private JobResponse getResponse(Job job) {
    if ((job.getStatus() == JobStatus.PUBLISHED || job.getStatus() == JobStatus.CLOSED)
        && job.getSnapshotData() != null) {
      try {
        JobResponse response = objectMapper.readValue(job.getSnapshotData(), JobResponse.class);
        response.setId(job.getId());
        response.setStatus(job.getStatus());
        response.setUpdatedAt(job.getUpdatedAt());

        // Fill fields that might be missing in older snapshots
        if (response.getDepartmentName() == null) {
          response.setDepartmentName(job.getDepartmentName());
        }
        if (response.getOpeningsCount() == null) {
          response.setOpeningsCount(job.getOpeningsCount());
        }
        if (response.getCompetencies() == null) {
          if (job.getRequiredCompetencies() != null) {
            response.setCompetencies(
                job.getRequiredCompetencies().stream()
                    .map(jobMapper::toCompetencyResponse)
                    .collect(Collectors.toList()));
          }
        }

        return response;
      } catch (Exception e) {
        // fallback to mapper if parsing fails
      }
    }
    return jobMapper.toResponse(job);
  }

  @Transactional(readOnly = true)
  public Page<JobResponse> getJobs(JobFilterRequest filter, Pageable pageable) {
    Page<Job> jobs = jobRepository.searchJobs(filter, pageable);
    return jobs.map(this::getResponse);
  }

  @Transactional(readOnly = true)
  public JobResponse getJobDetail(UUID id) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    return getResponse(job);
  }

  @Transactional
  public JobResponse createJob(UUID hrId, JobRequest request) {
    Job job = new Job();

    job.setHr(
        userRepository
            .findById(hrId)
            .orElseThrow(() -> new AppException(ErrorCode.HR_USER_NOT_FOUND)));

    mapRequestToEntity(request, job);
    job.setStatus(JobStatus.DRAFT);

    Job savedJob = jobRepository.save(job);
    return jobMapper.toResponse(savedJob);
  }

  @Transactional
  public JobResponse updateJob(UUID id, JobRequest request) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

    validateJobEditable(job);

    mapRequestToEntity(request, job);

    Job savedJob = jobRepository.save(job);
    return jobMapper.toResponse(savedJob);
  }

  @Transactional
  public void deleteJob(UUID id) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    if (job.getStatus() != JobStatus.DRAFT) {
      throw new AppException(ErrorCode.CANNOT_DELETE_PUBLISHED_JOB);
    }
    jobRepository.delete(job);
  }

  @Transactional
  public JobResponse publishJob(UUID id, String hrEmail) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    if (job.getStatus() != JobStatus.DRAFT) {
      throw new AppException(ErrorCode.JOB_NOT_DRAFT);
    }
    assertOwner(job, hrEmail);
    job.setStatus(JobStatus.PUBLISHED);

    JobResponse snapshotObj = jobMapper.toResponse(job);
    try {
      job.setSnapshotData(objectMapper.writeValueAsString(snapshotObj));
    } catch (Exception e) {
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    return getResponse(jobRepository.save(job));
  }

  @Transactional
  public JobResponse closeJob(UUID id, String hrEmail) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    assertOwner(job, hrEmail);
    if (job.getStatus() != JobStatus.PUBLISHED && job.getStatus() != JobStatus.PAUSED) {
      throw new AppException(ErrorCode.JOB_NOT_DRAFT);
    }
    job.setStatus(JobStatus.CLOSED);
    return jobMapper.toResponse(jobRepository.save(job));
  }

  @Transactional
  public JobResponse duplicateJob(UUID id) {
    Job originalJob =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));

    Job newJob = new Job();
    newJob.setTitle(originalJob.getTitle());
    newJob.setLocation(originalJob.getLocation());
    newJob.setEmploymentType(originalJob.getEmploymentType());
    newJob.setDescription(originalJob.getDescription());
    newJob.setRequirements(originalJob.getRequirements());
    newJob.setBenefits(originalJob.getBenefits());
    newJob.setJobFamily(originalJob.getJobFamily());
    newJob.setCareerLevel(originalJob.getCareerLevel());
    newJob.setHr(originalJob.getHr());
    newJob.setStatus(JobStatus.DRAFT);
    // id, createdAt, updatedAt, expiredAt are left null/default

    // Copy rules
    newJob.getInstitutionalRules().addAll(originalJob.getInstitutionalRules());

    // Copy competencies
    List<JobCompetency> newCompetencies =
        originalJob.getRequiredCompetencies().stream()
            .map(
                c -> {
                  JobCompetency jc = new JobCompetency();
                  jc.setJob(newJob);
                  jc.setCompetency(c.getCompetency());
                  jc.setWeight(c.getWeight());
                  jc.setRequiredLevel(c.getRequiredLevel());
                  jc.setIsMandatory(c.getIsMandatory());
                  return jc;
                })
            .collect(Collectors.toList());
    newJob.getRequiredCompetencies().addAll(newCompetencies);

    Job savedJob = jobRepository.save(newJob);
    return jobMapper.toResponse(savedJob);
  }

  @Transactional
  public JobResponse updateJobCompetencies(UUID id, List<JobCompetencyRequest> requests) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    validateJobEditable(job);

    job.getRequiredCompetencies().clear();

    if (requests != null) {
      List<JobCompetency> newCompetencies =
          requests.stream()
              .map(
                  req -> {
                    Competency competency =
                        competencyRepository
                            .findById(req.getCompetencyId())
                            .orElseThrow(() -> new AppException(ErrorCode.COMPETENCY_NOT_FOUND));

                    JobCompetency jc = new JobCompetency();
                    jc.setJob(job);
                    jc.setCompetency(competency);
                    jc.setWeight(req.getWeight());
                    jc.setRequiredLevel(req.getRequiredLevel());
                    jc.setIsMandatory(req.getIsMandatory());
                    return jc;
                  })
              .collect(Collectors.toList());

      job.getRequiredCompetencies().addAll(newCompetencies);
    }

    jobRepository.save(job);
    return jobMapper.toResponse(job);
  }

  @Transactional
  public JobResponse updateJobRules(UUID id, JobRuleUpdateRequest request) {
    Job job =
        jobRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    validateJobEditable(job);

    List<InstitutionalRule> rules = new ArrayList<>();
    if (request != null && request.getRuleIds() != null && !request.getRuleIds().isEmpty()) {
      rules = institutionalRuleRepository.findAllById(request.getRuleIds());
    }

    job.setInstitutionalRules(rules);
    jobRepository.save(job);
    return jobMapper.toResponse(job);
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

  private void validateJobEditable(Job job) {
    if (job.getStatus() == JobStatus.CLOSED) {
      throw new AppException(ErrorCode.CANNOT_UPDATE_PUBLISHED_JOB_WITH_APPLICANTS);
    }
    if (job.getStatus() == JobStatus.PUBLISHED) {
      int applicantCount = applicationRepository.countByJobId(job.getId());
      if (applicantCount > 0) {
        throw new AppException(ErrorCode.CANNOT_UPDATE_PUBLISHED_JOB_WITH_APPLICANTS);
      }
    }
  }

  private void assertOwner(Job job, String hrEmail) {
    if (job.getHr() == null || !hrEmail.equalsIgnoreCase(job.getHr().getEmail())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
  }
}
