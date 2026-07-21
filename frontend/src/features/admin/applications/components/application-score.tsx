import { cn } from "@/lib/cn";

export function ApplicationScore({ score }: { score?: number }) {
  if (score === undefined) return <span className="text-xs text-faint">Chưa có điểm</span>;
  const tone = score >= 80 ? "bg-success" : score >= 65 ? "bg-info" : "bg-warning";
  return (
    <div className="min-w-24">
      <div className="flex items-center justify-between gap-3"><strong className="text-sm font-semibold tabular-nums text-ink">{score}%</strong><span className="text-[10px] text-muted">Phù hợp</span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-soft"><div className={cn("h-full rounded-full", tone)} style={{ width: `${score}%` }} /></div>
    </div>
  );
}
