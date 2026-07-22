import Link from "next/link";
import { ArrowRight, Bot, CircleAlert, FileClock, ScanSearch, type LucideIcon } from "lucide-react";
import type { HrAttentionItem } from "@/features/hr/dashboard/dashboard.types";
import { cn } from "@/lib/cn";

const icons: Record<string, LucideIcon> = {
  "incomplete-jobs": FileClock,
  "pending-applications": ScanSearch,
  "low-confidence": CircleAlert,
  "ai-failed": Bot,
};
const toneClasses = { warning: "bg-warning/10 text-warning", danger: "bg-danger/10 text-danger", info: "bg-info/10 text-info" };

export function HrAttentionQueue({ items }: { items: HrAttentionItem[] }) {
  return (
    <section id="hr-attention" className="scroll-mt-24 rounded-[12px] border border-border bg-surface" aria-labelledby="hr-attention-title">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div><p className="admin-kicker text-accent">Cần hành động</p><h2 id="hr-attention-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Việc đang chờ bạn</h2></div>
        <span className="grid size-9 place-items-center rounded-full bg-signal text-sm font-bold text-ink">{items.reduce((sum, item) => sum + item.count, 0)}</span>
      </header>
      <div className="divide-y divide-border">
        {items.map((item) => {
          const Icon = icons[item.id] ?? CircleAlert;
          return <Link href={item.href} key={item.id} className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-[#fafbf8]"><span className={cn("grid size-10 place-items-center rounded-[9px]", toneClasses[item.tone])}><Icon className="size-[18px]" /></span><span><span className="block text-sm font-semibold text-ink">{item.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{item.description}</span></span><span className="flex items-center gap-3"><strong className="text-xl font-semibold tabular-nums text-ink">{item.count}</strong><ArrowRight className="size-4 text-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" /></span></Link>;
        })}
      </div>
    </section>
  );
}
