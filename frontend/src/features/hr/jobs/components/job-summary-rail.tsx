import { Bot, CalendarDays, FileUser, Sparkles } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { jobStatusMap } from "@/config/status";
import type { HrJobDetail } from "@/features/hr/jobs/jobs.types";
import { formatDate } from "@/lib/format";

export function HrJobSummaryRail({ job }: { job: HrJobDetail }) {
  const status = jobStatusMap[job.status];
  const processed = job.aiCompletedCount + job.aiFailedCount;
  const successRate = processed ? Math.round((job.aiCompletedCount / processed) * 100) : 0;
  return (
    <aside className="space-y-4 xl:sticky xl:top-24">
      <section className="rounded-[12px] border border-border bg-surface p-5"><p className="admin-kicker text-muted">Trạng thái tin</p><div className="mt-4"><StatusDot label={status.label} tone={status.tone} /></div>{job.expired ? <p className="mt-3 rounded-[8px] bg-danger/8 px-3 py-2 text-xs font-medium text-danger">Tin đã quá hạn nhận hồ sơ.</p> : job.expiresSoon ? <p className="mt-3 rounded-[8px] bg-warning/8 px-3 py-2 text-xs font-medium text-warning">Tin sẽ hết hạn trong 7 ngày tới.</p> : null}<dl className="mt-5 space-y-3 border-t border-border pt-4"><InfoRow label="Ngày tạo" value={formatDate(job.createdAt)} /><InfoRow label="Hết hạn" value={formatDate(job.expiresAt)} /><InfoRow label="Mã tin" value={job.id.toUpperCase()} compact /></dl></section>
      <section className="rounded-[12px] border border-border bg-surface p-5"><p className="admin-kicker text-muted">Hiệu quả xử lý</p><div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[9px] border border-border bg-border"><Metric icon={FileUser} value={job.applicationCount} label="Hồ sơ" /><Metric icon={Sparkles} value={job.newApplicationCount} label="Hồ sơ mới" /><Metric icon={Bot} value={job.aiFailedCount} label="AI lỗi" danger /><Metric icon={CalendarDays} value={`${successRate}%`} label="AI hoàn thành" /></div></section>
    </aside>
  );
}

function InfoRow({ label, value, compact }: { label: string; value: string; compact?: boolean }) { return <div className="flex items-center justify-between gap-4 text-xs"><dt className="text-muted">{label}</dt><dd className={compact ? "text-[11px] font-semibold tracking-[0.03em] text-ink" : "font-medium text-ink"}>{value}</dd></div>; }
function Metric({ icon: Icon, value, label, danger }: { icon: typeof Bot; value: number | string; label: string; danger?: boolean }) { return <div className="bg-surface p-3"><Icon className={`size-4 ${danger ? "text-danger" : "text-brand"}`} /><strong className="mt-2 block text-xl tracking-[-0.04em] text-ink">{value}</strong><span className="text-[10px] text-muted">{label}</span></div>; }
