import { Check, Circle, CircleX, LoaderCircle, Minus } from "lucide-react";
import type { AiPipelineStep } from "@/features/admin/applications/applications.types";
import { cn } from "@/lib/cn";

const icons = { COMPLETED: Check, ACTIVE: LoaderCircle, FAILED: CircleX, PENDING: Circle, SKIPPED: Minus };
const styles = {
  COMPLETED: "border-success bg-success text-white",
  ACTIVE: "border-info bg-info text-white",
  FAILED: "border-danger bg-danger text-white",
  PENDING: "border-border-strong bg-surface text-faint",
  SKIPPED: "border-border bg-surface-soft text-faint",
};

export function AiProcessRail({ steps }: { steps: AiPipelineStep[] }) {
  return <section className="rounded-[12px] border border-border bg-surface p-5" aria-labelledby="ai-process-title">
    <div><p className="admin-kicker text-info">Dấu vết xử lý</p><h2 id="ai-process-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Quy trình AI</h2></div>
    <ol className="mt-6 grid gap-0 md:grid-cols-5">
      {steps.map((step, index) => { const Icon = icons[step.status]; return <li key={step.id} className="relative grid grid-cols-[36px_1fr] gap-3 pb-5 last:pb-0 md:block md:pb-0 md:pr-4">
        {index < steps.length - 1 ? <span className="absolute left-[17px] top-9 h-[calc(100%-32px)] w-px bg-border md:left-9 md:right-0 md:top-[17px] md:h-px md:w-auto" /> : null}
        <span className={cn("relative z-10 grid size-9 place-items-center rounded-full border-2", styles[step.status])}><Icon className={cn("size-4", step.status === "ACTIVE" && "animate-spin")} /></span>
        <div className="md:mt-3"><p className="text-xs font-semibold text-ink">{step.label}</p><p className="mt-1 text-[11px] leading-5 text-muted">{step.message}</p></div>
      </li>; })}
    </ol>
  </section>;
}
