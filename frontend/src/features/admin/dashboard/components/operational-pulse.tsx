import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DashboardMetric } from "@/features/admin/dashboard/dashboard.types";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";

export function OperationalPulse({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section aria-labelledby="operational-pulse-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="operational-pulse-title" className="admin-kicker text-muted">
          Nhịp vận hành
        </h2>
        <span className="text-[11px] text-faint">Số liệu từ dữ liệu mô phỏng</span>
      </div>
      <div className="grid overflow-hidden rounded-[12px] border border-border bg-surface sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric, index) => (
          <Link
            href={metric.href}
            key={metric.id}
            className={cn(
              "group relative min-h-36 border-b border-border p-5 transition-colors hover:bg-[#fafbf8] sm:border-r xl:border-b-0",
              index === 1 && "sm:border-r-0 xl:border-r",
              index === metrics.length - 1 && "border-b-0 sm:col-span-2 sm:border-r-0 xl:col-span-1",
              metric.emphasis && "bg-signal/[0.09]",
            )}
          >
            {metric.emphasis ? <span className="absolute left-0 top-5 h-8 w-[3px] rounded-r-full bg-accent" /> : null}
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium leading-5 text-muted">{metric.label}</p>
              <ArrowUpRight className="size-4 text-faint transition-colors group-hover:text-brand" />
            </div>
            <p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.04em] text-ink">
              {formatInteger(metric.value)}<span className="ml-0.5 text-lg">{metric.suffix}</span>
            </p>
            <p className={cn("mt-3 text-[11px] text-faint", metric.emphasis && "font-medium text-accent")}>{metric.change}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
