import type { JobStatus, EmploymentType, JobCompetencyRequirement } from "@/types/domain/recruitment";

export type JobFilterRequest = {
  search?: string;
  departmentId?: string;
  careerLevelId?: string;
  location?: string;
  employmentType?: EmploymentType;
  page?: number;
  size?: number;
  sort?: string[];
};

export type JobResponse = {
  id: string;
  title: string;
  departmentName: string;
  status: JobStatus;
  location: string;
  employmentType: EmploymentType;
  openingsCount: number;
  description: string;
  requirements: string;
  benefits: string;
  jobFamilyId?: string;
  jobFamilyName?: string;
  careerLevelId?: string;
  careerLevelName?: string;
  competencies: JobCompetencyRequirement[];
  createdAt: string;
  expiredAt: string;
};
