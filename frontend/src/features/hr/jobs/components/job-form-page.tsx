"use client";

import { ErrorState } from "@/components/data-display/error-state";
import { HrJobDetailSkeleton } from "@/features/hr/jobs/components/job-detail-skeleton";
import { HrJobForm } from "@/features/hr/jobs/components/job-form";
import { useHrProfile } from "@/features/hr/dashboard/dashboard.queries";
import { useHrCatalogOptions, useHrJob } from "@/features/hr/jobs/jobs.queries";

export function HrNewJobFormPage() {
  const profile = useHrProfile();
  const catalog = useHrCatalogOptions();
  if (profile.isPending || catalog.isPending) return <HrJobDetailSkeleton />;
  if (profile.isError || catalog.isError) { const error = profile.error ?? catalog.error; return <ErrorState description={error?.message} onRetry={() => { void profile.refetch(); void catalog.refetch(); }} />; }
  return <HrJobForm profile={profile.data} catalog={catalog.data} />;
}

export function HrEditJobFormPage({ jobId }: { jobId: string }) {
  const profile = useHrProfile();
  const catalog = useHrCatalogOptions();
  const job = useHrJob(jobId);
  if (profile.isPending || catalog.isPending || job.isPending) return <HrJobDetailSkeleton />;
  if (profile.isError || catalog.isError || job.isError) { const error = profile.error ?? catalog.error ?? job.error; return <ErrorState title="Không thể chỉnh sửa tin" description={error?.message} onRetry={() => { void profile.refetch(); void catalog.refetch(); void job.refetch(); }} />; }
  if (job.data.status !== "DRAFT") return <ErrorState title="Tin đã được mở hoặc đóng" description="Tin tuyển dụng sau khi mở không thể chỉnh sửa để giữ nguyên nội dung đã công bố. Bạn có thể đóng tin hoặc nhân bản thành bản nháp từ trang chi tiết." />;
  return <HrJobForm profile={profile.data} catalog={catalog.data} job={job.data} />;
}
