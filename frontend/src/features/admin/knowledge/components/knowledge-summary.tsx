import { BookOpenCheck, Layers3, Network, TriangleAlert } from "lucide-react";
import type { KnowledgeOverview } from "@/features/admin/knowledge/knowledge.types";

export function KnowledgeSummary({ data }: { data: KnowledgeOverview }) {
  const metrics = [
    { label: "Nhóm nghề đang dùng", value: data.jobFamilies.filter((item) => item.status === "ACTIVE").length, icon: Network },
    { label: "Cấp bậc", value: data.careerLevels.filter((item) => item.status === "ACTIVE").length, icon: Layers3 },
    { label: "Năng lực đang dùng", value: data.competencies.filter((item) => item.status === "ACTIVE").length, icon: BookOpenCheck },
    { label: "Cần hoàn thiện", value: data.competencies.filter((item) => item.completedLevels < 5).length, icon: TriangleAlert },
  ];

  return (
    <section className="grid overflow-hidden rounded-[12px] border border-border bg-surface sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }, index) => (
        <div key={label} className={`flex items-center gap-4 px-5 py-4 ${index ? "border-t border-border" : ""} ${index % 2 ? "sm:border-l" : ""} ${index === 1 ? "sm:border-t-0" : ""} ${index ? "xl:border-l xl:border-t-0" : ""}`}>
          <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-surface-soft text-brand"><Icon className="size-[18px]" /></span>
          <div><p className="text-xl font-semibold tracking-[-0.03em] text-ink tabular-nums">{value}</p><p className="mt-0.5 text-xs text-muted">{label}</p></div>
        </div>
      ))}
    </section>
  );
}
