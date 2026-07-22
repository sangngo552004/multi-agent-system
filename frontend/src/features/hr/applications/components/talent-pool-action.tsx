"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookmarkPlus, CheckCircle2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HrApplicationDetail } from "@/features/hr/applications/applications.types";
import { parseTalentLabels, talentPoolFormSchema, type TalentPoolFormValues } from "@/features/hr/talent-pool/talent-pool.schema";
import { useSaveTalentPoolEntry } from "@/features/hr/talent-pool/talent-pool.queries";

function defaultRetentionDate() { return new Date(Date.now() + 180 * 86_400_000).toISOString().slice(0, 10); }

export function TalentPoolAction({ application }: { application: HrApplicationDetail }) {
  const [open, setOpen] = useState(false);
  const mutation = useSaveTalentPoolEntry();
  const form = useForm<TalentPoolFormValues>({ resolver: zodResolver(talentPoolFormSchema), defaultValues: { labelsText: "", note: "", retentionUntil: defaultRetentionDate() } });
  const submit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({ applicationId: application.id, labels: parseTalentLabels(values.labelsText), note: values.note, retentionUntil: values.retentionUntil });
      toast.success("Đã lưu vào kho ứng viên tiềm năng");
      setOpen(false);
    } catch (error) { toast.error("Không thể lưu ứng viên", { description: error instanceof Error ? error.message : "Vui lòng thử lại." }); }
  });

  if (application.talentPoolEntryId) return <section className="rounded-[12px] border border-success/20 bg-success/[0.035] p-5"><div className="flex gap-3"><CheckCircle2 className="size-5 shrink-0 text-success" /><div><h2 className="text-sm font-semibold text-ink">Đã có trong kho tiềm năng</h2><p className="mt-1 text-xs leading-5 text-muted">Bạn có thể cập nhật nhãn, ghi chú và hạn lưu tại trang quản lý kho.</p><Button asChild size="sm" variant="secondary" className="mt-3"><Link href="/hr/talent-pool">Mở kho ứng viên</Link></Button></div></div></section>;
  if (!application.talentPoolConsent) return <section className="rounded-[12px] border border-border bg-surface p-5"><div className="flex gap-3"><LockKeyhole className="size-5 shrink-0 text-muted" /><div><h2 className="text-sm font-semibold text-ink">Chưa thể lưu hồ sơ</h2><p className="mt-1 text-xs leading-5 text-muted">Ứng viên chưa xác nhận đồng ý lưu dữ liệu cho các nhu cầu tuyển dụng sau.</p></div></div></section>;

  return <section className="rounded-[12px] border border-border bg-surface p-5"><p className="admin-kicker text-muted">Nguồn ứng viên nội bộ</p><h2 className="mt-2 text-base font-semibold text-ink">Ứng viên tiềm năng</h2><p className="mt-2 text-xs leading-5 text-muted">Ứng viên đã đồng ý lưu hồ sơ. Thêm nhãn ngắn để dễ tìm cho nhu cầu sau.</p><Button className="mt-4 w-full" variant="secondary" size="sm" onClick={() => setOpen(true)}><BookmarkPlus className="size-4" /> Lưu vào kho tiềm năng</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent title="Lưu ứng viên tiềm năng" description={`Lưu ${application.candidateName} từ hồ sơ ${application.jobTitle}.`}><form onSubmit={submit} className="mt-5 space-y-4"><Field label="Nhãn" hint="Phân cách bằng dấu phẩy, tối đa 6 nhãn" error={form.formState.errors.labelsText?.message}><Input placeholder="Ví dụ: Data, Ưu tiên Q4" {...form.register("labelsText")} /></Field><Field label="Ghi chú nội bộ" error={form.formState.errors.note?.message}><Textarea className="min-h-24" placeholder="Điểm phù hợp cần ghi nhớ..." {...form.register("note")} /></Field><Field label="Hạn lưu dữ liệu" hint="Có thể gia hạn khi vẫn còn nhu cầu" error={form.formState.errors.retentionUntil?.message}><Input type="date" min={new Date().toISOString().slice(0, 10)} {...form.register("retentionUntil")} /></Field><div className="rounded-[9px] bg-surface-soft p-3 text-[11px] leading-5 text-muted">Hồ sơ chỉ được dùng cho tuyển dụng nội bộ, không chia sẻ ra ngoài tổ chức.</div><div className="flex justify-end gap-2"><DialogClose asChild><Button type="button" variant="secondary">Hủy</Button></DialogClose><Button type="submit" loading={mutation.isPending}>Lưu ứng viên</Button></div></form></DialogContent></Dialog></section>;
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-ink">{label}{hint ? <span className="font-normal text-muted">{hint}</span> : null}</span>{children}{error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : null}</label>; }
