"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data-display/empty-state";
import { ErrorState } from "@/components/data-display/error-state";
import { ActiveJobsPanel } from "@/features/hr/dashboard/components/active-jobs-panel";
import { HrApplicationTrendChart } from "@/features/hr/dashboard/components/application-trend-chart";
import { HrAttentionQueue } from "@/features/hr/dashboard/components/attention-queue";
import { HrDashboardHeader } from "@/features/hr/dashboard/components/dashboard-header";
import { HrDashboardSkeleton } from "@/features/hr/dashboard/components/dashboard-skeleton";
import { RecruitmentFunnel } from "@/features/hr/dashboard/components/recruitment-funnel";
import { RecruitmentPulse } from "@/features/hr/dashboard/components/recruitment-pulse";
import { useHrDashboard, useHrProfile } from "@/features/hr/dashboard/dashboard.queries";
import type { HrDashboardRange } from "@/features/hr/dashboard/dashboard.types";
import { resetDemoData } from "@/mocks/reset-demo";

export function HrDashboardPage() {
  const [range, setRange] = useState<HrDashboardRange>(7);
  const dashboard = useHrDashboard(range);
  const profile = useHrProfile();
  const queryClient = useQueryClient();
  const reset = async () => { resetDemoData(); await queryClient.invalidateQueries(); };

  return (
    <div className="space-y-8">
      <HrDashboardHeader range={range} onRangeChange={setRange} generatedAt={dashboard.data?.generatedAt} hrName={profile.data?.fullName} />
      {dashboard.isPending ? <HrDashboardSkeleton /> : null}
      {dashboard.isError ? <ErrorState title="Chưa thể tổng hợp bàn làm việc" description={dashboard.error.message} onRetry={() => dashboard.refetch()} /> : null}
      {dashboard.data && !dashboard.data.hasData ? <div className="rounded-[12px] border border-border bg-surface"><EmptyState title="Chưa có dữ liệu tuyển dụng" description="Bạn chưa phụ trách vị trí hoặc hồ sơ nào trong kịch bản hiện tại." action={<Button onClick={reset}>Khôi phục dữ liệu demo</Button>} /></div> : null}
      {dashboard.data?.hasData ? <div className="space-y-6"><RecruitmentPulse metrics={dashboard.data.metrics} /><div className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]"><HrAttentionQueue items={dashboard.data.attention} /><HrApplicationTrendChart data={dashboard.data.trend} /></div><div className="grid items-start gap-6 xl:grid-cols-[0.72fr_1.28fr]"><RecruitmentFunnel data={dashboard.data.funnel} /><ActiveJobsPanel jobs={dashboard.data.activeJobs} /></div></div> : null}
    </div>
  );
}
