"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HrTrendDatum } from "@/features/hr/dashboard/dashboard.types";

export function HrApplicationTrendChart({ data }: { data: HrTrendDatum[] }) {
  return (
    <section className="rounded-[12px] border border-border bg-surface p-5" aria-labelledby="hr-trend-title">
      <div className="flex items-start justify-between"><div><p className="admin-kicker text-brand">Lượng hồ sơ</p><h2 id="hr-trend-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Hồ sơ theo ngày</h2></div><span className="text-[11px] text-muted">Theo ngày nộp</span></div>
      <div className="mt-5 h-[260px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <defs><linearGradient id="hrApplicationFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#174d3c" stopOpacity={0.22} /><stop offset="100%" stopColor="#174d3c" stopOpacity={0.01} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#e7ebe7" strokeDasharray="3 5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#667169", fontSize: 10 }} interval={data.length > 12 ? 4 : 0} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#667169", fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: 9, borderColor: "#dce3dd", fontSize: 12 }} />
            <Area type="monotone" dataKey="applications" name="Hồ sơ" stroke="#174d3c" strokeWidth={2.2} fill="url(#hrApplicationFill)" activeDot={{ fill: "#d8f05f", stroke: "#174d3c", strokeWidth: 2, r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
