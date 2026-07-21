import Link from "next/link";
import { Bot, CalendarDays, FileUser, Mail, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { jobStatusMap, verificationStatusMap } from "@/config/status";
import type { JobDetail } from "@/features/admin/jobs/jobs.types";
import { formatDate, getInitials } from "@/lib/format";

export function JobSummaryRail({ job }: { job: JobDetail }) {
  const status = jobStatusMap[job.status];
  const verification = verificationStatusMap[job.owner.verificationStatus];
  return (
    <aside className="space-y-4 xl:sticky xl:top-24">
      <section className="rounded-[12px] border border-border bg-surface p-5">
        <p className="admin-kicker text-muted">Trạng thái tin</p>
        <div className="mt-4"><StatusDot label={status.label} tone={status.tone} /></div>
        {job.moderationState === "REJECTED" ? <div className="mt-4 rounded-[9px] border border-danger/20 bg-danger/[0.04] p-3"><Badge tone="danger">Đã trả về HR</Badge><p className="mt-2 text-xs leading-5 text-muted">{job.rejectionReason}</p></div> : null}
        <dl className="mt-5 space-y-3 border-t border-border pt-4">
          <InfoRow label="Ngày tạo" value={formatDate(job.createdAt)} />
          <InfoRow label="Hết hạn" value={formatDate(job.expiresAt)} />
          <InfoRow label="Mã tin" value={job.id.toUpperCase()} compact />
        </dl>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5">
        <p className="admin-kicker text-muted">Nhà tuyển dụng</p>
        <Link href={`/admin/users/${job.owner.id}`} className="group mt-4 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[9px] bg-surface-soft text-xs font-semibold text-brand">{getInitials(job.owner.fullName)}</span>
          <span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink group-hover:text-brand">{job.owner.fullName}</span><span className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted"><Mail className="size-3" />{job.owner.email}</span></span>
        </Link>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="flex items-center gap-2 text-xs text-muted"><UserRound className="size-3.5" />Xác minh HR</span><Badge tone={verification.tone}>{verification.label}</Badge></div>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5">
        <p className="admin-kicker text-muted">Hiệu quả tin</p>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[9px] border border-border bg-border">
          <Metric icon={FileUser} value={job.applicationCount} label="Ứng viên" />
          <Metric icon={Bot} value={job.aiCompletedCount} label="AI xong" />
          <Metric icon={Bot} value={job.aiFailedCount} label="AI lỗi" danger />
          <Metric icon={CalendarDays} value={job.averageMatchScore === undefined ? "—" : `${job.averageMatchScore}%`} label="Match TB" />
        </div>
      </section>
    </aside>
  );
}

function InfoRow({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return <div className="flex items-center justify-between gap-4 text-xs"><dt className="text-muted">{label}</dt><dd className={compact ? "text-[11px] font-semibold tracking-[0.03em] text-ink" : "font-medium text-ink"}>{value}</dd></div>;
}

function Metric({ icon: Icon, value, label, danger }: { icon: typeof Bot; value: number | string; label: string; danger?: boolean }) {
  return <div className="bg-surface p-3"><Icon className={`size-4 ${danger ? "text-danger" : "text-brand"}`} /><strong className="mt-2 block text-xl tracking-[-0.04em] text-ink">{value}</strong><span className="text-[10px] text-muted">{label}</span></div>;
}
