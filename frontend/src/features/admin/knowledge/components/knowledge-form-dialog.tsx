"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { careerLevelSchema, competencySchema, jobFamilySchema } from "@/features/admin/knowledge/knowledge.schema";
import { useSaveCareerLevel, useSaveCompetency, useSaveJobFamily } from "@/features/admin/knowledge/knowledge.queries";
import type { CareerLevelView, CompetencyView, JobFamilyView } from "@/features/admin/knowledge/knowledge.types";

type FormKind = "JOB_FAMILY" | "CAREER_LEVEL" | "COMPETENCY";
type ExistingItem = JobFamilyView | CareerLevelView | CompetencyView;

const copy = {
  JOB_FAMILY: { singular: "nhóm nghề", title: "Nhóm nghề" },
  CAREER_LEVEL: { singular: "cấp bậc", title: "Cấp bậc nghề nghiệp" },
  COMPETENCY: { singular: "năng lực", title: "Năng lực" },
};

export function KnowledgeFormDialog({ kind, item }: { kind: FormKind; item?: ExistingItem }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState("category" in (item ?? {}) ? (item as CompetencyView).category : "");
  const [rankValue, setRankValue] = useState("rankValue" in (item ?? {}) ? String((item as CareerLevelView).rankValue) : "1");
  const [error, setError] = useState("");
  const saveFamily = useSaveJobFamily();
  const saveLevel = useSaveCareerLevel();
  const saveCompetency = useSaveCompetency();
  const pending = saveFamily.isPending || saveLevel.isPending || saveCompetency.isPending;

  const openDialog = () => {
    setName(item?.name ?? ""); setDescription(item?.description ?? "");
    setCategory(item && "category" in item ? item.category : "");
    setRankValue(item && "rankValue" in item ? String(item.rankValue) : "1"); setError("");
    setOpen(true);
  };

  const submit = async () => {
    const base = { name, description };
    const parsed = kind === "JOB_FAMILY" ? jobFamilySchema.safeParse(base) : kind === "CAREER_LEVEL" ? careerLevelSchema.safeParse({ ...base, rankValue }) : competencySchema.safeParse({ ...base, category });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ."); return; }
    try {
      if (kind === "JOB_FAMILY") await saveFamily.mutateAsync({ id: item?.id, ...base });
      if (kind === "CAREER_LEVEL") await saveLevel.mutateAsync({ id: item?.id, ...base, rankValue: Number(rankValue) });
      if (kind === "COMPETENCY") await saveCompetency.mutateAsync({ id: item?.id, ...base, category });
      toast.success(item ? `Đã cập nhật ${copy[kind].singular}` : `Đã thêm ${copy[kind].singular}`, { description: name });
      setOpen(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu dữ liệu."); }
  };

  return <>
    <Button size="sm" variant={item ? "ghost" : "primary"} onClick={openDialog}>{item ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}{item ? "Sửa" : `Thêm ${copy[kind].singular}`}</Button>
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}><DialogContent title={`${item ? "Chỉnh sửa" : "Thêm"} ${copy[kind].title.toLowerCase()}`} description="Thông tin này được dùng trong cấu hình việc làm và quy trình đối sánh.">
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div className="mt-6 space-y-4"><Field label="Tên"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder={`Nhập tên ${copy[kind].singular}`} /></Field>{kind === "COMPETENCY" ? <Field label="Nhóm năng lực"><Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ví dụ: Công nghệ" /></Field> : null}{kind === "CAREER_LEVEL" ? <Field label="Thứ tự cấp bậc"><Input type="number" min={1} max={20} value={rankValue} onChange={(event) => setRankValue(event.target.value)} /></Field> : null}<Field label="Mô tả"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả ngắn gọn và dễ hiểu..." /></Field>{error ? <p className="text-xs text-danger">{error}</p> : null}</div>
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Hủy</Button><Button type="submit" loading={pending}>Lưu thay đổi</Button></div>
      </form>
    </DialogContent></Dialog>
  </>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-ink">{label}</span>{children}</label>; }
