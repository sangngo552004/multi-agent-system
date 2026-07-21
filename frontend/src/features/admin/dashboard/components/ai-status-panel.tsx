"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip } from "recharts";
import type { AiStatusDatum } from "@/features/admin/dashboard/dashboard.types";

export function AiStatusPanel({ data }: { data: AiStatusDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-[12px] border border-border bg-surface p-5" aria-labelledby="ai-status-title">
      <div>
        <p className="admin-kicker text-info">Hệ thống AI</p>
        <h2 id="ai-status-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Trạng thái xử lý AI</h2>
      </div>
      <div className="mt-4 grid items-center gap-3 sm:grid-cols-[minmax(180px,0.9fr)_1fr]">
        <div className="relative h-52 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius={58} outerRadius={82} paddingAngle={2} strokeWidth={0} isAnimationActive>
                {data.map((item) => <Cell key={item.status} fill={item.color} />)}
              </Pie>
              <ChartTooltip contentStyle={{ borderRadius: 9, borderColor: "#dce3dd", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <span><strong className="block text-2xl tracking-[-0.04em] text-ink">{total}</strong><span className="text-[10px] text-muted">hồ sơ</span></span>
          </div>
        </div>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.status} className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 last:border-0 last:pb-0">
              <span className="flex items-center gap-2 text-xs text-muted"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
              <span className="text-sm font-semibold tabular-nums text-ink">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
