"use client";

import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import type { DashboardRange } from "@/features/admin/dashboard/dashboard.types";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

export function DashboardHeader({
  range,
  onRangeChange,
  generatedAt,
}: {
  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
  generatedAt?: string;
}) {
  return (
    <PageHeader
      eyebrow="Trung tâm vận hành"
      title="Chào buổi sáng, Admin."
      description="Những việc đáng chú ý của hệ thống tuyển dụng nội bộ được gom tại đây để bạn xử lý nhanh."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {generatedAt ? (
            <span className="hidden items-center gap-2 text-xs text-muted xl:flex">
              <CalendarDays className="size-4" /> Cập nhật {formatDate(generatedAt, "HH:mm · dd/MM")}
            </span>
          ) : null}
          <div className="flex rounded-[9px] border border-border-strong bg-surface p-1" aria-label="Khoảng thời gian">
            {([7, 30] as DashboardRange[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onRangeChange(value)}
                className={cn(
                  "rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors",
                  range === value ? "bg-brand text-white" : "text-muted hover:text-ink",
                )}
              >
                {value} ngày
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
