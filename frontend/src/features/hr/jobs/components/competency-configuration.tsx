"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { HrJobFormValues } from "@/features/hr/jobs/jobs.schema";
import type { HrCatalogOptions } from "@/features/hr/jobs/jobs.types";
import { cn } from "@/lib/cn";

export function CompetencyConfiguration({ control, register, catalog, disabled }: { control: Control<HrJobFormValues>; register: UseFormRegister<HrJobFormValues>; catalog: HrCatalogOptions; disabled?: boolean }) {
  const { fields, append, remove } = useFieldArray({ control, name: "competencies" });
  const competencies = useWatch({ control, name: "competencies" }) ?? [];
  const [selectedId, setSelectedId] = useState("__none");
  const selectedIds = new Set(competencies.map((item) => item.competencyId));
  const available = catalog.competencies.filter((item) => !selectedIds.has(item.id));
  const totalWeight = competencies.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  const add = () => {
    const item = catalog.competencies.find((entry) => entry.id === selectedId);
    if (!item) return;
    append({ competencyId: item.id, name: item.name, requiredLevel: 3, weight: Math.max(1, 100 - totalWeight), mandatory: false });
    setSelectedId("__none");
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-sm font-semibold text-ink">Năng lực yêu cầu</h3><p className="mt-1 text-xs leading-5 text-muted">Chọn tiêu chí, mức mong đợi và mức ảnh hưởng đến kết quả đối sánh.</p></div><div className={cn("rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums", totalWeight === 100 ? "bg-success/8 text-success" : "bg-warning/8 text-warning")}>Tổng trọng số: {totalWeight}%</div></div>
      {!disabled ? <div className="mt-4 flex flex-col gap-2 rounded-[10px] border border-border bg-surface-soft/45 p-3 sm:flex-row"><div className="flex-1"><Select label="Chọn năng lực" value={selectedId} onValueChange={setSelectedId} options={[{ value: "__none", label: available.length ? "Chọn năng lực để thêm" : "Đã chọn hết năng lực" }, ...available.map((item) => ({ value: item.id, label: `${item.name} · ${item.category}` }))]} disabled={!available.length} /></div><Button type="button" variant="secondary" onClick={add} disabled={!selectedId || selectedId === "__none"}><Plus className="size-4" /> Thêm năng lực</Button></div> : null}
      {fields.length ? <div className="mt-4 space-y-3">{fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-[10px] border border-border bg-surface p-4 md:grid-cols-[minmax(0,1fr)_110px_120px_auto] md:items-end"><div><p className="text-sm font-semibold text-ink">{field.name}</p><label className="mt-3 inline-flex items-center gap-2 text-xs text-muted"><input type="checkbox" className="size-4 accent-[var(--brand)]" disabled={disabled} {...register(`competencies.${index}.mandatory`)} /> Năng lực bắt buộc</label></div><FieldLabel label="Mức yêu cầu"><Input type="number" min={1} max={5} disabled={disabled} {...register(`competencies.${index}.requiredLevel`, { valueAsNumber: true })} /></FieldLabel><FieldLabel label="Trọng số (%)"><Input type="number" min={1} max={100} disabled={disabled} {...register(`competencies.${index}.weight`, { valueAsNumber: true })} /></FieldLabel><Button type="button" size="icon" variant="ghost" className="text-danger hover:text-danger" onClick={() => remove(index)} disabled={disabled} aria-label={`Xóa ${field.name}`}><Trash2 className="size-4" /></Button></div>)}</div> : <div className="mt-4 rounded-[10px] border border-dashed border-warning/35 bg-warning/[0.035] px-4 py-6 text-center text-xs text-warning">Chưa có năng lực nào. Tin có thể lưu nháp nhưng chưa thể mở tuyển.</div>}
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-ink">{label}</span>{children}</label>; }
