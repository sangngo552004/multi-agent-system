"use client";

import { Check, Circle, Eye, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { competencyLevelsSchema } from "@/features/admin/knowledge/knowledge.schema";
import { useSaveCompetencyLevels } from "@/features/admin/knowledge/knowledge.queries";
import type { CompetencyLevel } from "@/types/domain/admin";

export function CompetencyLadder({ competencyId, initialLevels }: { competencyId: string; initialLevels: CompetencyLevel[] }) {
  const [levels, setLevels] = useState(() => [...initialLevels].sort((a, b) => b.level - a.level));
  const [previewLevel, setPreviewLevel] = useState(5);
  const [error, setError] = useState("");
  const mutation = useSaveCompetencyLevels(competencyId);
  const completed = levels.filter((item) => item.title.trim().length >= 2 && item.description.trim().length >= 2).length;
  const preview = levels.find((item) => item.level === previewLevel) ?? levels[0];
  const progress = useMemo(() => `${completed * 20}%`, [completed]);

  const update = (level: number, field: "title" | "description", value: string) => {
    setLevels((current) => current.map((item) => item.level === level ? { ...item, [field]: value } : item));
    setError("");
  };

  const submit = async () => {
    const parsed = competencyLevelsSchema.safeParse({ levels });
    if (!parsed.success) { setError(`Cấp độ ${levels.find((item) => !item.title.trim() || !item.description.trim())?.level ?? ""} chưa có đủ tên và mô tả.`); return; }
    try {
      await mutation.mutateAsync(parsed.data.levels);
      toast.success("Đã lưu thang năng lực", { description: "Cả 5 cấp độ đã được cập nhật." });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thang năng lực.");
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.7fr)]">
      <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold text-ink">Thang năng lực 5 cấp độ</h2><p className="mt-1 text-xs text-muted">Mô tả hành vi quan sát được từ cơ bản đến chuyên gia.</p></div>
          <div className="min-w-44"><div className="mb-2 flex justify-between text-xs"><span className="text-muted">Đã hoàn thiện</span><strong className="text-ink tabular-nums">{completed}/5</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-surface-soft"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: progress }} /></div></div>
        </div>
        <div className="divide-y divide-border">
          {levels.map((item) => {
            const complete = item.title.trim().length >= 2 && item.description.trim().length >= 2;
            return <div key={item.level} className="grid gap-4 px-5 py-5 md:grid-cols-[58px_minmax(0,1fr)]">
              <div className="relative flex md:block"><span className={`grid size-10 place-items-center rounded-full border text-sm font-semibold ${complete ? "border-brand bg-brand text-white" : "border-border-strong bg-surface-soft text-muted"}`}>{complete ? <Check className="size-4" /> : item.level}</span>{item.level > 1 ? <span className="absolute left-5 top-10 hidden h-[calc(100%+20px)] w-px bg-border md:block" /> : null}</div>
              <div><div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-brand">Cấp độ {item.level}</p><button type="button" onClick={() => setPreviewLevel(item.level)} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-brand"><Eye className="size-3.5" /> Xem trước</button></div><Input value={item.title} onChange={(event) => update(item.level, "title", event.target.value)} aria-label={`Tên cấp độ ${item.level}`} placeholder="Tên ngắn gọn cho cấp độ" /><Textarea className="mt-3 min-h-24" value={item.description} onChange={(event) => update(item.level, "description", event.target.value)} aria-label={`Mô tả cấp độ ${item.level}`} placeholder="Mô tả biểu hiện và phạm vi công việc ở cấp độ này..." /></div>
            </div>;
          })}
        </div>
        <div className="flex flex-col gap-3 border-t border-border bg-surface-soft/55 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-danger">{error}</p><Button onClick={submit} loading={mutation.isPending}><Save className="size-4" />Lưu thang năng lực</Button></div>
      </section>

      <aside className="sticky top-24 overflow-hidden rounded-[12px] border border-border bg-[#102a21] text-white">
        <div className="border-b border-white/10 px-5 py-4"><p className="admin-kicker text-signal">Bản xem trước</p><p className="mt-2 text-sm text-[#b8c9c0]">Cách cấp độ xuất hiện khi admin hoặc HR tham chiếu.</p></div>
        <div className="p-5"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-signal text-base font-bold text-ink">{preview?.level}</span><div><p className="text-xs text-[#91a398]">Cấp độ {preview?.level}</p><h3 className="mt-0.5 font-semibold">{preview?.title || "Chưa đặt tên"}</h3></div></div><p className="mt-5 min-h-28 text-sm leading-7 text-[#c7d3cd]">{preview?.description || "Thêm mô tả để giải thích hành vi và phạm vi công việc ở cấp độ này."}</p><div className="mt-5 flex gap-2">{[1, 2, 3, 4, 5].map((level) => <button key={level} type="button" onClick={() => setPreviewLevel(level)} aria-label={`Xem cấp độ ${level}`} className={`grid size-8 cursor-pointer place-items-center rounded-full text-xs font-semibold transition-colors ${previewLevel === level ? "bg-signal text-ink" : "bg-white/8 text-[#a9bab1] hover:bg-white/15"}`}>{level}</button>)}</div></div>
        <div className="flex items-center gap-2 border-t border-white/10 px-5 py-4 text-xs text-[#91a398]"><Circle className="size-3 fill-current" />Dữ liệu dùng cho đối sánh hồ sơ</div>
      </aside>
    </div>
  );
}
