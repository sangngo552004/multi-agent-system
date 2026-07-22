"use client";

import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, MapPin } from "lucide-react";
import { ErrorState } from "@/components/data-display/error-state";
import { StatusDot } from "@/components/ui/status-dot";
import { jobStatusMap } from "@/config/status";
import { HrJobContentPreview } from "@/features/hr/jobs/components/job-content-preview";
import { HrJobDetailSkeleton } from "@/features/hr/jobs/components/job-detail-skeleton";
import { HrJobMatchingPanel } from "@/features/hr/jobs/components/job-matching-panel";
import { HrJobLifecycleActions } from "@/features/hr/jobs/components/job-lifecycle-actions";
import { JobPipelinePanel } from "@/features/hr/jobs/components/job-pipeline-panel";
import { HrJobSummaryRail } from "@/features/hr/jobs/components/job-summary-rail";
import { RecentApplications } from "@/features/hr/jobs/components/recent-applications";
import { hrEmploymentTypeLabels } from "@/features/hr/jobs/jobs.constants";
import { useHrJob } from "@/features/hr/jobs/jobs.queries";

export function HrJobDetailPage({ jobId }: { jobId: string }) {
  const query = useHrJob(jobId);
  if (query.isPending) return <HrJobDetailSkeleton />;
  if (query.isError) return <ErrorState title="Không thể mở tin tuyển dụng" description={query.error.message} onRetry={() => query.refetch()} />;
  const job = query.data;
  const status = jobStatusMap[job.status];
  return (
    <div className="space-y-7">
      <Link href="/hr/jobs" className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-brand"><ArrowLeft className="size-4" /> Quay lại danh sách</Link>
      <header className="flex flex-col gap-5 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="admin-kicker text-brand">{job.departmentName}</p><h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-ink sm:text-[38px]">{job.title}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-2"><MapPin className="size-4" />{job.location}</span><span className="inline-flex items-center gap-2"><BriefcaseBusiness className="size-4" />{hrEmploymentTypeLabels[job.employmentType]}</span></div></div><div className="flex flex-col items-start gap-3 lg:items-end"><StatusDot label={status.label} tone={status.tone} /><HrJobLifecycleActions job={job} /></div></header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.72fr)]"><div className="min-w-0 space-y-6"><HrJobContentPreview job={job} /><HrJobMatchingPanel job={job} /><RecentApplications job={job} /></div><div className="space-y-4"><HrJobSummaryRail job={job} /><JobPipelinePanel job={job} /></div></div>
    </div>
  );
}
