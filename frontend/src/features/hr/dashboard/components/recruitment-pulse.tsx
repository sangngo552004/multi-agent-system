import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Clock3, FilePlus2, ListChecks, UsersRound, type LucideIcon } from "lucide-react";
import type { HrDashboardMetric } from "@/features/hr/dashboard/dashboard.types";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";

const metricIcons: Record<HrDashboardMetric["id"], LucideIcon> = {
  "open-jobs": BriefcaseBusiness,
  "new-applications": FilePlus2,
  "pending-review": ListChecks,
  shortlisted: UsersRound,
  "expiring-jobs": Clock3,
};

export function RecruitmentPulse({ metrics }: { metrics: HrDashboardMetric[] }) {
  return (
    <section aria-labelledby="recruitment-pulse-title">
      <div className="mb-3 flex items-center justify-between"><h2 id="recruitment-pulse-title" className="admin-kicker text-muted">Nhịp tuyển dụng</h2><span className="text-[11px] text-faint">Phạm vi công việc của bạn</span></div>
      <div className="grid overflow-hidden rounded-[12px] border border-border bg-surface sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric, index) => {
          const Icon = metricIcons[metric.id];
          return (
            <Link href={metric.href} key={metric.id} className={cn("group relative min-h-36 border-b border-border p-5 transition-colors hover:bg-[#fafbf8] sm:border-r xl:border-b-0", index === 1 && "sm:border-r-0 xl:border-r", index === metrics.length - 1 && "border-b-0 sm:col-span-2 sm:border-r-0 xl:col-span-1", metric.emphasis && "bg-signal/[0.09]")}> 
              {metric.emphasis ? <span className="absolute left-0 top-5 h-8 w-[3px] rounded-r-full bg-accent" /> : null}
              <div className="flex items-start justify-between"><span className="grid size-8 place-items-center rounded-[8px] bg-surface-soft text-brand"><Icon className="size-4" /></span><ArrowUpRight className="size-4 text-faint transition-colors group-hover:text-brand" /></div>
              <p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.04em] text-ink">{formatInteger(metric.value)}</p>
              <p className="mt-2 text-xs font-medium text-ink">{metric.label}</p>
              <p className="mt-1 text-[10px] text-faint">{metric.note}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
