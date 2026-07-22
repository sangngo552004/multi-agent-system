import type { RecruitmentJob } from "@/types/domain/recruitment";

export function getJobReadinessIssues(job: RecruitmentJob) {
  const issues: string[] = [];
  const totalWeight = job.competencies.reduce((sum, item) => sum + item.weight, 0);

  if (!job.title.trim()) issues.push("Thiếu tiêu đề");
  if (!job.description.trim()) issues.push("Thiếu mô tả");
  if (!job.requirements.length) issues.push("Thiếu yêu cầu công việc");
  if (!job.jobFamilyId) issues.push("Chưa chọn nhóm nghề");
  if (!job.careerLevelId) issues.push("Chưa chọn cấp bậc");
  if (!job.competencies.length) issues.push("Chưa cấu hình năng lực");
  if (job.competencies.some((item) => item.requiredLevel < 1 || item.requiredLevel > 5)) {
    issues.push("Mức năng lực phải nằm trong thang 1–5");
  }
  if (job.competencies.length && Math.abs(totalWeight - 100) > 0.01) {
    issues.push("Tổng trọng số năng lực phải bằng 100%");
  }

  return issues;
}
