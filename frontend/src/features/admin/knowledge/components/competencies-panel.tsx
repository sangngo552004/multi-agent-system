"use client";

import Link from "next/link";
import { ArrowUpRight, CircleCheckBig, CircleDashed } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/data-display/empty-state";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusDot } from "@/components/ui/status-dot";
import { KnowledgeFormDialog } from "@/features/admin/knowledge/components/knowledge-form-dialog";
import { ToggleKnowledgeDialog } from "@/features/admin/knowledge/components/toggle-knowledge-dialog";
import type { CompetencyView } from "@/features/admin/knowledge/knowledge.types";
import type { KnowledgeItemStatus } from "@/types/domain/admin";

export function CompetenciesPanel({ items }: { items: CompetencyView[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState<KnowledgeItemStatus | "ALL">("ALL");
  const categories = useMemo(() => [...new Set(items.map((item) => item.category))].sort(), [items]);
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return items.filter((item) => (!keyword || `${item.name} ${item.category}`.toLocaleLowerCase("vi").includes(keyword)) && (category === "ALL" || item.category === category) && (status === "ALL" || item.status === status));
  }, [category, items, search, status]);

  return (
    <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between xl:p-5">
        <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc nhóm năng lực..." className="w-full xl:max-w-sm" />
        <div className="flex flex-wrap gap-2"><Select label="Nhóm năng lực" value={category} onValueChange={setCategory} options={[{ value: "ALL", label: "Mọi nhóm năng lực" }, ...categories.map((item) => ({ value: item, label: item }))]} /><Select label="Trạng thái" value={status} onValueChange={(value) => setStatus(value as KnowledgeItemStatus | "ALL")} options={[{ value: "ALL", label: "Mọi trạng thái" }, { value: "ACTIVE", label: "Đang dùng" }, { value: "INACTIVE", label: "Tạm ngưng" }]} /><KnowledgeFormDialog kind="COMPETENCY" /></div>
      </div>
      {filtered.length ? <div className="divide-y divide-border">{filtered.map((item) => {
        const complete = item.completedLevels === 5;
        return <article key={item.id} className="grid gap-4 px-4 py-4 transition-colors hover:bg-surface-soft/60 md:grid-cols-[minmax(0,1fr)_150px_150px_auto] md:items-center md:px-5">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link href={`/admin/knowledge/competencies/${item.id}`} className="font-semibold text-ink transition-colors hover:text-brand">{item.name}</Link><span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-medium text-muted">{item.category}</span></div><p className="mt-1 line-clamp-1 text-sm text-muted">{item.description}</p></div>
          <div><p className="text-xs text-faint">Mức độ hoàn thiện</p><p className={`mt-1 flex items-center gap-2 text-sm font-semibold ${complete ? "text-success" : "text-warning"}`}>{complete ? <CircleCheckBig className="size-4" /> : <CircleDashed className="size-4" />}{item.completedLevels}/5 cấp độ</p></div>
          <div><p className="text-xs text-faint">Đang được sử dụng</p><p className="mt-1 text-sm font-semibold text-ink tabular-nums">{item.usageCount} tin tuyển dụng</p></div>
          <div className="flex flex-wrap items-center gap-1 md:justify-end"><StatusDot label={item.status === "ACTIVE" ? "Đang dùng" : "Tạm ngưng"} tone={item.status === "ACTIVE" ? "success" : "neutral"} className="mr-2 text-xs" /><KnowledgeFormDialog kind="COMPETENCY" item={item} /><ToggleKnowledgeDialog entity="COMPETENCY" id={item.id} name={item.name} status={item.status} usageCount={item.usageCount} /><Link href={`/admin/knowledge/competencies/${item.id}`} aria-label={`Mở ${item.name}`} className="grid size-9 cursor-pointer place-items-center rounded-[9px] text-muted transition-colors hover:bg-surface-soft hover:text-brand"><ArrowUpRight className="size-4" /></Link></div>
        </article>;
      })}</div> : <EmptyState title="Không tìm thấy năng lực" description="Thử thay đổi từ khóa, nhóm năng lực hoặc trạng thái." />}
    </section>
  );
}
