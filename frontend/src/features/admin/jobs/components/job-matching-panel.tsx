import { AlertTriangle, CheckCircle2, CircleDashed, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { JobDetail } from "@/features/admin/jobs/jobs.types";

export function JobMatchingPanel({ job }: { job: JobDetail }) {
  return (
    <section className="rounded-[12px] border border-border bg-[#13291f] text-white" aria-labelledby="matching-config-title">
      <header className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="admin-kicker text-[#a5b6ac]">Cấu hình kỹ thuật</p>
          <h2 id="matching-config-title" className="mt-1.5 flex items-center gap-2 text-lg font-semibold"><SlidersHorizontal className="size-[18px] text-signal" /> Hồ sơ đối sánh</h2>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ${job.matchingReady ? "bg-signal text-ink" : "bg-warning/20 text-[#ffd99b]"}`}>
          {job.matchingReady ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
          {job.matchingReady ? "Sẵn sàng cho AI" : "Thiếu cấu hình"}
        </span>
      </header>

      <div className="grid gap-px bg-white/10 sm:grid-cols-2">
        <Meta label="Nhóm nghề" value={job.jobFamilyName ?? "Chưa cấu hình"} />
        <Meta label="Cấp bậc" value={job.careerLevelName ?? "Chưa cấu hình"} />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-white">Năng lực yêu cầu</h3><span className="text-[10px] font-medium tabular-nums text-[#8ca296]">{job.competencies.length} tiêu chí</span></div>
        {job.competencies.length ? (
          <div className="mt-4 divide-y divide-white/10 rounded-[9px] border border-white/10">
            {job.competencies.map((item) => (
              <div key={item.competencyId} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_90px_140px] sm:items-center">
                <div><p className="text-sm font-medium text-white">{item.name}</p><div className="mt-1.5 flex items-center gap-2"><span className="text-[10px] text-[#8ca296]">Cấp {item.requiredLevel}/5</span>{item.mandatory ? <Badge tone="signal" className="border-0 py-0.5">Bắt buộc</Badge> : <span className="text-[10px] text-[#8ca296]">Bổ trợ</span>}</div></div>
                <span className="text-xs font-semibold tabular-nums text-[#bfd0c6] sm:text-right">{item.weight}%</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-signal" style={{ width: `${item.weight}%` }} /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3 rounded-[9px] border border-dashed border-warning/35 bg-warning/5 p-4 text-xs leading-5 text-[#ffd99b]"><CircleDashed className="size-5 shrink-0" />HR chưa thêm năng lực yêu cầu cho vị trí này.</div>
        )}
        {job.readinessIssues.length ? (
          <div className="mt-4 rounded-[9px] bg-white/[0.045] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ffd99b]">Cần hoàn thiện trước khi duyệt</p><ul className="mt-2 space-y-1 text-xs text-[#b8c7be]">{job.readinessIssues.map((issue) => <li key={issue}>· {issue}</li>)}</ul></div>
        ) : null}
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#13291f] px-5 py-4"><p className="admin-kicker text-[#91a398]">{label}</p><p className="mt-1.5 text-sm font-medium text-white">{value}</p></div>;
}
