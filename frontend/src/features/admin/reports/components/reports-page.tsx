"use client";

import { CalendarRange, CircleCheckBig, Gauge, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/data-display/empty-state";
import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AiStatusPanel } from "@/features/admin/dashboard/components/ai-status-panel";
import { ApplicationTrendChart } from "@/features/admin/dashboard/components/application-trend-chart";
import { OperationalPulse } from "@/features/admin/dashboard/components/operational-pulse";
import { useDashboard } from "@/features/admin/dashboard/dashboard.queries";
import type { DashboardRange } from "@/features/admin/dashboard/dashboard.types";

export function ReportsPage() {
  const [range, setRange] = useState<DashboardRange>(30);
  const report = useDashboard(range);
  if (report.isPending) return <ReportSkeleton />;
  if (report.isError) return <ErrorState title="Không thể tạo báo cáo" description={report.error.message} onRetry={() => report.refetch()} />;

  return <div className="space-y-7">
    <PageHeader eyebrow="Tổng hợp vận hành" title="Báo cáo cơ bản" description="Một góc nhìn gọn về người dùng, tin tuyển dụng, hồ sơ và tình trạng xử lý AI trong dữ liệu demo." actions={<Select label="Khoảng báo cáo" value={String(range)} onValueChange={(value) => setRange(Number(value) as DashboardRange)} options={[{ value: "7", label: "7 ngày gần đây" }, { value: "30", label: "30 ngày gần đây" }]} />} />
    {!report.data.hasData ? <EmptyState title="Chưa có dữ liệu báo cáo" description="Chuyển kịch bản demo về Bình thường để xem số liệu mẫu." /> : <>
      <OperationalPulse metrics={report.data.metrics} />
      <ReportNotes range={range} data={report.data} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]"><ApplicationTrendChart data={report.data.trend} /><AiStatusPanel data={report.data.aiStatuses} /></div>
    </>}
  </div>;
}

function ReportNotes({ range, data }: { range: DashboardRange; data: NonNullable<ReturnType<typeof useDashboard>["data"]> }) {
  const total = data.aiStatuses.reduce((sum, item) => sum + item.value, 0);
  const completed = data.aiStatuses.find((item) => item.status === "COMPLETED")?.value ?? 0;
  const failed = data.aiStatuses.find((item) => item.status === "FAILED")?.value ?? 0;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const notes = [
    { icon: CalendarRange, label: "Phạm vi dữ liệu", value: `${range} ngày`, description: "Tính theo ngày hồ sơ được nộp." },
    { icon: CircleCheckBig, label: "Tỷ lệ AI hoàn thành", value: `${completionRate}%`, description: `${completed}/${total} hồ sơ đã có kết quả.` },
    { icon: failed ? TriangleAlert : Gauge, label: "Hồ sơ AI thất bại", value: String(failed), description: failed ? "Cần kiểm tra trong hồ sơ ứng tuyển." : "Hệ thống đang vận hành ổn định." },
  ];
  return <section className="grid gap-3 md:grid-cols-3">{notes.map(({ icon: Icon, label, value, description }) => <article key={label} className="rounded-[12px] border border-border bg-surface p-5"><div className="flex items-start justify-between"><span className="grid size-9 place-items-center rounded-[9px] bg-surface-soft text-brand"><Icon className="size-[18px]" /></span><strong className="text-2xl tracking-[-0.04em] text-ink tabular-nums">{value}</strong></div><h2 className="mt-4 text-sm font-semibold text-ink">{label}</h2><p className="mt-1 text-xs leading-5 text-muted">{description}</p></article>)}</section>;
}

function ReportSkeleton() { return <div className="space-y-7"><div><Skeleton className="h-3 w-32" /><Skeleton className="mt-3 h-10 w-64" /><Skeleton className="mt-3 h-4 w-full max-w-xl" /></div><Skeleton className="h-40 rounded-[12px]" /><div className="grid gap-6 xl:grid-cols-2"><Skeleton className="h-80 rounded-[12px]" /><Skeleton className="h-80 rounded-[12px]" /></div></div>; }
