import Link from "next/link";
import { Bot, Building2, CalendarDays, FileUser, Mail } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { jobStatusMap } from "@/config/status";
import type { JobDetail } from "@/features/admin/jobs/jobs.types";
import { formatDate, getInitials } from "@/lib/format";

export function JobSummaryRail({ job }: { job: JobDetail }) {
  const status = jobStatusMap[job.status];
  const processedCount = job.aiCompletedCount + job.aiFailedCount;
  const successRate = processedCount ? Math.round((job.aiCompletedCount / processedCount) * 100) : 0;
  return (
    <aside className="space-y-4 xl:sticky xl:top-24">
      <section className="rounded-[12px] border border-border bg-surface p-5">
        <p className="admin-kicker text-muted">Trạng thái tin</p>
        <div className="mt-4"><StatusDot label={status.label} tone={status.tone} /></div>
        <p className="mt-3 text-xs leading-5 text-muted">Trạng thái này do HR phụ trách cập nhật.</p>
        <dl className="mt-5 space-y-3 border-t border-border pt-4">
          <InfoRow label="Ngày tạo" value={formatDate(job.createdAt)} />
          <InfoRow label="Hết hạn" value={formatDate(job.expiresAt)} />
          <InfoRow label="Mã tin" value={job.id.toUpperCase()} compact />
        </dl>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5">
        <p className="admin-kicker text-muted">HR phụ trách</p>
        <Link href={`/admin/users/${job.owner.id}`} className="group mt-4 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[9px] bg-surface-soft text-xs font-semibold text-brand">{getInitials(job.owner.fullName)}</span>
          <span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink group-hover:text-brand">{job.owner.fullName}</span><span className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted"><Mail className="size-3" />{job.owner.email}</span></span>
        </Link>
        <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-3"><span className="flex items-center gap-2 text-xs text-muted"><Building2 className="size-3.5" />Đơn vị</span><span className="text-right text-xs font-medium text-ink">{job.owner.departmentName ?? job.departmentName}</span></div>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-5">
        <p className="admin-kicker text-muted">Hiệu quả tin</p>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[9px] border border-border bg-border">
          <Metric icon={FileUser} value={job.applicationCount} label="Ứng viên" />
          <Metric icon={Bot} value={job.aiCompletedCount} label="AI xong" />
          <Metric icon={Bot} value={job.aiFailedCount} label="AI lỗi" danger />
          <Metric icon={CalendarDays} value={`${successRate}%`} label="AI thành công" />
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
