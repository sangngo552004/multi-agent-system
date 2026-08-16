"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCompetencyLevels, useSaveCompetencyLevels } from "../knowledge-base.queries";
import type { Competency } from "../knowledge-base.types";

export function CompetencyLevelsDialog({ competency, initialLevel, onClose }: { competency: Competency | null; initialLevel?: number; onClose: () => void }) {
  const levels = useCompetencyLevels(competency?.id ?? null);
  const save = useSaveCompetencyLevels();
  const [items, setItems] = useState<{ level: number; label: string; description: string }[]>([]);
  const displayedItems = items.length ? items : levels.data ?? [];
  return <Dialog open={Boolean(competency)} onOpenChange={(open) => !open && onClose()}>{competency ? <DialogContent title={`Thang năng lực: ${competency.name}`} description="AI dùng mô tả này để đối chiếu mức độ đáp ứng trong CV." className="max-w-2xl"><div className="mt-5 space-y-3">{displayedItems.map((item, index) => <div key={item.level} className={`rounded-lg border p-3 ${item.level === initialLevel ? "border-brand bg-brand/5" : "border-border"}`}><p className="text-sm font-semibold text-ink">Cấp {item.level} · {item.label}</p><Textarea value={item.description} onChange={(event) => setItems((current) => (current.length ? current : displayedItems).map((value, i) => i === index ? { ...value, description: event.target.value } : value))} rows={2} className="mt-2" /></div>)}</div><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Đóng</Button><Button loading={save.isPending} onClick={async () => { await save.mutateAsync({ competencyId: competency.id, levels: displayedItems }); onClose(); }}>Lưu thang level</Button></div></DialogContent> : null}</Dialog>;
}
