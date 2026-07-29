"use client";

import { useState } from "react";
import { EmptyState } from "@/components/data-display/empty-state";
import { ErrorState } from "@/components/data-display/error-state";
import { AiStatusPanel } from "@/features/admin/dashboard/components/ai-status-panel";
import { ApplicationTrendChart } from "@/features/admin/dashboard/components/application-trend-chart";
import { AttentionQueue } from "@/features/admin/dashboard/components/attention-queue";
import { DashboardHeader } from "@/features/admin/dashboard/components/dashboard-header";
import { DashboardSkeleton } from "@/features/admin/dashboard/components/dashboard-skeleton";
import { OperationalPulse } from "@/features/admin/dashboard/components/operational-pulse";
import { RecentActivity } from "@/features/admin/dashboard/components/recent-activity";
import { useDashboard } from "@/features/admin/dashboard/dashboard.queries";
import type { DashboardRange } from "@/features/admin/dashboard/dashboard.types";
import { useAuth } from "@/features/auth/auth-provider";

export function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>(7);
  const dashboard = useDashboard(range);
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <DashboardHeader
        range={range}
        onRangeChange={setRange}
        generatedAt={dashboard.data?.generatedAt}
        userName={user?.fullName}
      />
      {dashboard.isPending ? <DashboardSkeleton /> : null}
      {dashboard.isError ? <ErrorState description={dashboard.error.message} onRetry={() => dashboard.refetch()} /> : null}
      {dashboard.data && !dashboard.data.hasData ? (
        <div className="rounded-[12px] border border-border bg-surface">
          <EmptyState title="Chưa có dữ liệu vận hành" description="Hệ thống chưa ghi nhận tài khoản, vị trí tuyển dụng, hồ sơ hoặc hoạt động để tổng hợp." />
        </div>
      ) : null}
      {dashboard.data?.hasData ? (
        <div className="space-y-6">
          <OperationalPulse metrics={dashboard.data.metrics} />
          <div className="grid items-start gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <AttentionQueue items={dashboard.data.attention} />
            <AiStatusPanel data={dashboard.data.aiStatuses} />
          </div>
          <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <ApplicationTrendChart data={dashboard.data.trend} />
            <RecentActivity activities={dashboard.data.recentActivities} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
