"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, CalendarClock, Edit3, Mail, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseTalentLabels, talentPoolFormSchema, type TalentPoolFormValues } from "@/features/hr/talent-pool/talent-pool.schema";
import { useRemoveTalentPoolEntry, useUpdateTalentPoolEntry } from "@/features/hr/talent-pool/talent-pool.queries";
import type { TalentPoolListItem } from "@/features/hr/talent-pool/talent-pool.types";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/format";

export function TalentPoolCard({ entry }: { entry: TalentPoolListItem }) {
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const update = useUpdateTalentPoolEntry();
  const remove = useRemoveTalentPoolEntry();
  const form = useForm<TalentPoolFormValues>({ resolver: zodResolver(talentPoolFormSchema), defaultValues: { labelsText: entry.labels.join(", "), note: entry.note, retentionUntil: new Date(entry.retentionUntil).toISOString().slice(0, 10) } });
  const openEdit = () => {
    form.reset({ labelsText: entry.labels.join(", "), note: entry.note, retentionUntil: new Date(entry.retentionUntil).toISOString().slice(0, 10) });
    setEditOpen(true);
  };
  const submit = form.handleSubmit(async (values) => {
    try { await update.mutateAsync({ entryId: entry.id, labels: parseTalentLabels(values.labelsText), note: values.note, retentionUntil: values.retentionUntil }); toast.success("Đã cập nhật ứng viên tiềm năng"); setEditOpen(false); }
    catch (error) { toast.error("Không thể cập nhật", { description: error instanceof Error ? error.message : "Vui lòng thử lại." }); }
  });
  const confirmRemove = async () => {
    try { await remove.mutateAsync(entry.id); toast.success("Đã xóa khỏi kho ứng viên"); setRemoveOpen(false); }
    catch (error) { toast.error("Không thể xóa ứng viên", { description: error instanceof Error ? error.message : "Vui lòng thử lại." }); }
  };

  return <article className="group flex flex-col overflow-hidden rounded-[12px] border border-border bg-surface transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-soft"><div className="h-1 bg-gradient-to-r from-brand via-brand to-signal" /><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-[11px] bg-brand text-xs font-semibold text-white">{getInitials(entry.candidateName)}</span><div className="min-w-0"><h2 className="truncate text-base font-semibold text-ink">{entry.candidateName}</h2><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted"><Mail className="size-3.5" />{entry.candidateEmail}</p></div></div>{entry.expired ? <Badge tone="danger">Hết hạn lưu</Badge> : entry.matchScore !== undefined ? <span className="shrink-0 text-right"><strong className="text-xl tabular-nums text-ink">{entry.matchScore}</strong><span className="text-xs text-muted">/100</span></span> : null}</div><div className="mt-5 grid grid-cols-2 gap-3 rounded-[9px] bg-surface-soft/65 p-3"><div><p className="text-[10px] text-muted">Vị trí trước đây</p><p className="mt-1 text-xs font-semibold text-ink">{entry.previousJobTitle}</p></div><div><p className="text-[10px] text-muted">Định hướng</p><p className="mt-1 text-xs font-semibold text-ink">{entry.jobFamilyName ?? "Chưa phân loại"} · {entry.careerLevelName ?? "—"}</p></div></div><div className="mt-4 flex flex-wrap gap-1.5">{entry.labels.map((label) => <Badge key={label} tone="signal">{label}</Badge>)}{!entry.labels.length ? <span className="text-xs text-faint">Chưa có nhãn</span> : null}</div><p className="mt-4 line-clamp-2 min-h-10 text-xs leading-5 text-muted">{entry.note || "Chưa có ghi chú nội bộ."}</p><div className="mt-4 flex flex-wrap gap-1.5">{entry.skills.slice(0, 4).map((skill) => <Badge key={skill} tone="brand">{skill}</Badge>)}{entry.skills.length > 4 ? <Badge>+{entry.skills.length - 4}</Badge> : null}</div><div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted"><span className="flex items-center gap-1.5"><CalendarClock className="size-3.5" />Lưu đến {formatDate(entry.retentionUntil)}</span><span>{formatRelativeTime(entry.savedAt)}</span></div><div className="mt-4 flex items-center gap-2"><Button asChild size="sm" className="flex-1"><Link href={`/hr/applications/${entry.applicationId}`}>Mở hồ sơ gốc <ArrowUpRight className="size-4" /></Link></Button><Button size="icon" variant="secondary" className="size-9" onClick={openEdit} aria-label={`Sửa ${entry.candidateName}`}><Edit3 className="size-4" /></Button><Button size="icon" variant="ghost" className="size-9 text-danger hover:text-danger" onClick={() => setRemoveOpen(true)} aria-label={`Xóa ${entry.candidateName} khỏi kho`}><Trash2 className="size-4" /></Button></div></div>
    <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent title="Cập nhật ứng viên tiềm năng" description={`Điều chỉnh thông tin lưu trữ của ${entry.candidateName}.`}><form onSubmit={submit} className="mt-5 space-y-4"><FormField label="Nhãn" hint="Phân cách bằng dấu phẩy" error={form.formState.errors.labelsText?.message}><Input {...form.register("labelsText")} /></FormField><FormField label="Ghi chú" error={form.formState.errors.note?.message}><Textarea {...form.register("note")} /></FormField><FormField label="Hạn lưu dữ liệu" error={form.formState.errors.retentionUntil?.message}><Input type="date" min={new Date().toISOString().slice(0, 10)} {...form.register("retentionUntil")} /></FormField><div className="flex justify-end gap-2"><DialogClose asChild><Button type="button" variant="secondary">Hủy</Button></DialogClose><Button type="submit" loading={update.isPending}>Lưu thay đổi</Button></div></form></DialogContent></Dialog>
    <Dialog open={removeOpen} onOpenChange={setRemoveOpen}><DialogContent title="Xóa khỏi kho ứng viên?" description={`Hồ sơ gốc của ${entry.candidateName} vẫn được giữ, chỉ thông tin lưu trong kho tiềm năng bị xóa.`}><div className="mt-6 flex justify-end gap-2"><DialogClose asChild><Button variant="secondary">Hủy</Button></DialogClose><Button variant="danger" onClick={confirmRemove} loading={remove.isPending}>Xóa khỏi kho</Button></div></DialogContent></Dialog>
  </article>;
}

function FormField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 flex justify-between gap-2 text-xs font-semibold text-ink">{label}{hint ? <span className="font-normal text-muted">{hint}</span> : null}</span>{children}{error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : null}</label>; }
