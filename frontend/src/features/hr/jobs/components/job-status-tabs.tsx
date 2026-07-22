import type { JobStatus } from "@/types/domain/recruitment";
import { hrJobStatusTabs } from "@/features/hr/jobs/jobs.constants";
import { cn } from "@/lib/cn";

export function HrJobStatusTabs({ value, onChange, counts }: { value: JobStatus | "ALL"; onChange: (value: JobStatus | "ALL") => void; counts: Record<JobStatus, number> }) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return <div className="overflow-x-auto border-b border-border px-4 sm:px-5"><div className="flex min-w-max gap-5" role="tablist" aria-label="Lọc tin theo trạng thái">{hrJobStatusTabs.map((tab) => { const count = tab.value === "ALL" ? total : counts[tab.value]; return <button key={tab.value} type="button" role="tab" aria-selected={value === tab.value} onClick={() => onChange(tab.value)} className={cn("-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-0.5 py-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand", value === tab.value ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink")}>{tab.label}<span className={cn("rounded-full px-2 py-0.5 text-[10px] tabular-nums", value === tab.value ? "bg-brand/10 text-brand" : "bg-surface-soft text-faint")}>{count}</span></button>; })}</div></div>;
}
