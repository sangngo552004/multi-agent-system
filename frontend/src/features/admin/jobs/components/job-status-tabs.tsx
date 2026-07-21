import type { JobStatus } from "@/types/domain/admin";
import { jobStatusTabs } from "@/features/admin/jobs/jobs.constants";
import { cn } from "@/lib/cn";

export function JobStatusTabs({ value, onChange, counts }: { value: JobStatus | "ALL"; onChange: (value: JobStatus | "ALL") => void; counts: Record<JobStatus, number> }) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return (
    <div className="overflow-x-auto border-b border-border px-4 sm:px-5">
      <div className="flex min-w-max gap-1" role="tablist" aria-label="Lọc theo trạng thái tin">
        {jobStatusTabs.map((tab) => {
          const count = tab.value === "ALL" ? total : counts[tab.value];
          return (
            <button type="button" role="tab" aria-selected={value === tab.value} key={tab.value} onClick={() => onChange(tab.value)} className={cn("relative flex items-center gap-2 px-3 py-4 text-xs font-semibold text-muted transition-colors hover:text-ink", value === tab.value && "text-brand after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-brand")}>
              {tab.label}
              <span className={cn("rounded-full bg-surface-soft px-2 py-0.5 text-[9px] font-semibold tabular-nums text-muted", value === tab.value && "bg-brand/10 text-brand")}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
