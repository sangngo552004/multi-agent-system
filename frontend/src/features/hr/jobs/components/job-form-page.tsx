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
  if (job.data.status === "CLOSED") return <ErrorState title="Tin đã đóng" description="Tin đã đóng không thể chỉnh sửa. Bạn có thể nhân bản từ trang chi tiết để tạo một bản nháp mới." />;
  return <HrJobForm profile={profile.data} catalog={catalog.data} job={job.data} />;
}
