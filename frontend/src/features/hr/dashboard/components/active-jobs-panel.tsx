import Link from "next/link";
import { ArrowRight, CircleAlert, FileUser } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { jobStatusMap } from "@/config/status";
import type { HrActiveJob } from "@/features/hr/dashboard/dashboard.types";
import { formatDate } from "@/lib/format";

export function ActiveJobsPanel({ jobs }: { jobs: HrActiveJob[] }) {
  return (
    <section className="rounded-[12px] border border-border bg-surface" aria-labelledby="active-jobs-title">
      <header className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="admin-kicker text-muted">Đang phụ trách</p><h2 id="active-jobs-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Các vị trí gần hạn</h2></div><Link href="/hr/jobs" className="text-xs font-semibold text-brand hover:underline">Xem tất cả</Link></header>
      <div className="divide-y divide-border">
        {jobs.map((job) => {
          const status = jobStatusMap[job.status];
          return <Link href={`/hr/jobs/${job.id}`} key={job.id} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-[#fafbf8] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{job.title}</p><div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted"><StatusDot label={status.label} tone={status.tone} className="text-[11px]" />{!job.matchingReady ? <span className="inline-flex items-center gap-1 text-warning"><CircleAlert className="size-3" /> Thiếu cấu hình</span> : null}</div></div><div className="flex items-center gap-1.5 text-xs text-muted"><FileUser className="size-3.5" /><strong className="text-ink">{job.applicationCount}</strong>{job.newApplicationCount ? <span className="text-brand">· {job.newApplicationCount} mới</span> : null}</div><div className="flex items-center justify-between gap-3 text-xs text-muted sm:justify-end"><span>Hạn {formatDate(job.expiresAt, "dd/MM")}</span><ArrowRight className="size-4 text-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" /></div></Link>;
        })}
      </div>
    </section>
  );
}
