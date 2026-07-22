"use client";

import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import type { HrDashboardRange } from "@/features/hr/dashboard/dashboard.types";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

export function HrDashboardHeader({
  range,
  onRangeChange,
  generatedAt,
  hrName,
}: {
  range: HrDashboardRange;
  onRangeChange: (range: HrDashboardRange) => void;
  generatedAt?: string;
  hrName?: string;
}) {
  const shortName = hrName?.trim().split(/\s+/).at(-1) ?? "bạn";
  return (
    <PageHeader
      eyebrow="Bàn làm việc tuyển dụng"
      title={`Chào buổi sáng, ${shortName}.`}
      description="Những vị trí và hồ sơ cần bạn chú ý hôm nay được sắp xếp tại đây."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {generatedAt ? <span className="hidden items-center gap-2 text-xs text-muted xl:flex"><CalendarDays className="size-4" /> Cập nhật {formatDate(generatedAt, "HH:mm · dd/MM")}</span> : null}
          <div className="flex rounded-[9px] border border-border-strong bg-surface p-1" aria-label="Khoảng thời gian">
            {([7, 30] as HrDashboardRange[]).map((value) => <button key={value} type="button" onClick={() => onRangeChange(value)} className={cn("cursor-pointer rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand", range === value ? "bg-brand text-white" : "text-muted hover:text-ink")}>{value} ngày</button>)}
          </div>
        </div>
      }
    />
  );
}
