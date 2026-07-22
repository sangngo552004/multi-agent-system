import Link from "next/link";
import { ArrowRight, FileUser } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { aiStatusMap, recruitmentStatusMap } from "@/config/status";
import type { HrJobDetail } from "@/features/hr/jobs/jobs.types";
import { formatRelativeTime, getInitials } from "@/lib/format";

export function RecentApplications({ job }: { job: HrJobDetail }) {
  return (
    <section className="rounded-[12px] border border-border bg-surface" aria-labelledby="recent-applications-title">
      <header className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="admin-kicker text-muted">Hồ sơ gần đây</p><h2 id="recent-applications-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Ứng viên của vị trí</h2></div><Link href={`/hr/applications?jobId=${job.id}`} className="text-xs font-semibold text-brand hover:underline">Xem tất cả</Link></header>
      {job.recentApplications.length ? <div className="divide-y divide-border">{job.recentApplications.map((application) => { const recruitment = recruitmentStatusMap[application.recruitmentStatus]; const ai = aiStatusMap[application.aiStatus]; return <Link href={`/hr/applications/${application.id}`} key={application.id} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-[#fafbf8] sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-surface-soft text-[10px] font-semibold text-brand">{getInitials(application.candidateName)}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink">{application.candidateName}</span><span className="mt-0.5 block truncate text-[11px] text-muted">{application.candidateEmail}</span></span></div><StatusDot label={recruitment.label} tone={recruitment.tone} className="text-xs" /><div className="flex items-center gap-3 text-xs"><StatusDot label={`AI ${ai.label.toLowerCase()}`} tone={ai.tone} className="text-xs" />{application.matchScore !== undefined ? <strong className="tabular-nums text-ink">{application.matchScore}%</strong> : null}</div><div className="flex items-center justify-between gap-3 text-[11px] text-muted sm:justify-end"><span>{formatRelativeTime(application.submittedAt)}</span><ArrowRight className="size-4 text-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" /></div></Link>; })}</div> : <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center"><FileUser className="size-6 text-faint" /><p className="mt-3 text-sm font-semibold text-ink">Chưa có hồ sơ</p><p className="mt-1 text-xs text-muted">Ứng viên mới sẽ xuất hiện tại đây.</p></div>}
    </section>
  );
}
