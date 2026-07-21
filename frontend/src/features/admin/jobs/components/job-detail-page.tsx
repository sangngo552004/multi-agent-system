"use client";

import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, MapPin } from "lucide-react";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { jobStatusMap } from "@/config/status";
import { JobActionBar } from "@/features/admin/jobs/components/job-action-bar";
import { JobContentPreview } from "@/features/admin/jobs/components/job-content-preview";
import { JobDetailSkeleton } from "@/features/admin/jobs/components/job-detail-skeleton";
import { JobMatchingPanel } from "@/features/admin/jobs/components/job-matching-panel";
import { JobSummaryRail } from "@/features/admin/jobs/components/job-summary-rail";
import { employmentTypeLabels } from "@/features/admin/jobs/jobs.constants";
import { useJob } from "@/features/admin/jobs/jobs.queries";

export function JobDetailPage({ jobId }: { jobId: string }) {
  const jobQuery = useJob(jobId);
  if (jobQuery.isPending) return <JobDetailSkeleton />;
  if (jobQuery.isError) return <ErrorState title="Không thể mở tin tuyển dụng" description={jobQuery.error.message} onRetry={() => jobQuery.refetch()} />;
  const job = jobQuery.data;
  const status = jobStatusMap[job.status];

  return (
    <div className="space-y-7">
      <Link href="/admin/jobs" className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-brand"><ArrowLeft className="size-4" /> Quay lại danh sách</Link>
      <header className="flex flex-col gap-5 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><p className="admin-kicker text-brand">{job.companyName}</p>{job.moderationState === "REJECTED" ? <Badge tone="danger">Đã trả về HR</Badge> : null}</div>
          <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-ink sm:text-[38px]">{job.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-2"><MapPin className="size-4" />{job.location}</span><span className="inline-flex items-center gap-2"><BriefcaseBusiness className="size-4" />{employmentTypeLabels[job.employmentType]}</span></div>
        </div>
        <StatusDot label={status.label} tone={status.tone} />
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.72fr)]">
        <div className="min-w-0 space-y-6">
          <JobContentPreview job={job} />
          <JobMatchingPanel job={job} />
        </div>
        <JobSummaryRail job={job} />
      </div>
      <JobActionBar job={job} />
    </div>
  );
}
