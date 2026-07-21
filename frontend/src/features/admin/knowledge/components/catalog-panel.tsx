"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/data-display/empty-state";
import { SearchInput } from "@/components/ui/input";
import { StatusDot } from "@/components/ui/status-dot";
import { KnowledgeFormDialog } from "@/features/admin/knowledge/components/knowledge-form-dialog";
import { ToggleKnowledgeDialog } from "@/features/admin/knowledge/components/toggle-knowledge-dialog";
import type { CareerLevelView, JobFamilyView } from "@/features/admin/knowledge/knowledge.types";

type CatalogKind = "JOB_FAMILY" | "CAREER_LEVEL";

export function CatalogPanel({ kind, items }: { kind: CatalogKind; items: Array<JobFamilyView | CareerLevelView> }) {
  const [search, setSearch] = useState("");
  const isLevel = kind === "CAREER_LEVEL";
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    const result = keyword ? items.filter((item) => `${item.name} ${item.description}`.toLocaleLowerCase("vi").includes(keyword)) : items;
    return isLevel ? [...result].sort((a, b) => ("rankValue" in a ? a.rankValue : 0) - ("rankValue" in b ? b.rankValue : 0)) : result;
  }, [isLevel, items, search]);

  return (
    <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Tìm ${isLevel ? "cấp bậc" : "nhóm nghề"}...`} className="w-full sm:max-w-sm" />
        <KnowledgeFormDialog kind={kind} />
      </div>
      {filtered.length ? <div className="divide-y divide-border">{filtered.map((item) => (
        <article key={item.id} className="grid gap-4 px-4 py-4 transition-colors hover:bg-surface-soft/60 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-center sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-ink">{item.name}</h3>{"rankValue" in item ? <span className="rounded-full bg-brand/8 px-2 py-0.5 text-[11px] font-semibold text-brand">Bậc {item.rankValue}</span> : null}</div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{item.description}</p>
          </div>
          <div><p className="text-xs text-faint">Đang được sử dụng</p><p className="mt-1 text-sm font-semibold text-ink tabular-nums">{item.usageCount} tin tuyển dụng</p></div>
          <div className="flex flex-wrap items-center gap-1 sm:justify-end"><StatusDot label={item.status === "ACTIVE" ? "Đang dùng" : "Tạm ngưng"} tone={item.status === "ACTIVE" ? "success" : "neutral"} className="mr-2 text-xs" /><KnowledgeFormDialog kind={kind} item={item} /><ToggleKnowledgeDialog entity={kind} id={item.id} name={item.name} status={item.status} usageCount={item.usageCount} /></div>
        </article>
      ))}</div> : <EmptyState title={`Không tìm thấy ${isLevel ? "cấp bậc" : "nhóm nghề"}`} description="Thử từ khóa khác hoặc thêm một mục mới." />}
    </section>
  );
}
