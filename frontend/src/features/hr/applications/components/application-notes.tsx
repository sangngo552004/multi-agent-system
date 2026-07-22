"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAddHrApplicationNote } from "@/features/hr/applications/applications.queries";
import { hrApplicationNoteSchema, type HrApplicationNoteValues } from "@/features/hr/applications/applications.schema";
import type { HrApplicationDetail } from "@/features/hr/applications/applications.types";
import { formatRelativeTime } from "@/lib/format";

export function ApplicationNotes({ application }: { application: HrApplicationDetail }) {
  const mutation = useAddHrApplicationNote();
  const form = useForm<HrApplicationNoteValues>({ resolver: zodResolver(hrApplicationNoteSchema), defaultValues: { content: "" } });
  const submit = form.handleSubmit(async ({ content }) => {
    try { await mutation.mutateAsync({ applicationId: application.id, content }); form.reset(); toast.success("Đã lưu ghi chú nội bộ"); }
    catch (error) { toast.error("Không thể lưu ghi chú", { description: error instanceof Error ? error.message : "Vui lòng thử lại." }); }
  });
  return <section className="rounded-[12px] border border-border bg-surface p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-ink">Ghi chú nội bộ</h2><p className="mt-1 text-xs text-muted">Chỉ HR và người có quyền quản trị được xem.</p></div><LockKeyhole className="size-4 text-muted" /></div><form onSubmit={submit} className="mt-4"><Textarea {...form.register("content")} placeholder="Ghi lại điểm cần trao đổi hoặc kết quả sàng lọc..." className="min-h-24" /><div className="mt-2 flex items-start justify-between gap-3">{form.formState.errors.content ? <p className="text-xs text-danger">{form.formState.errors.content.message}</p> : <span />}<Button type="submit" size="sm" loading={mutation.isPending}><Send className="size-4" /> Lưu ghi chú</Button></div></form><div className="mt-5 space-y-3 border-t border-border pt-4">{application.notes.length ? application.notes.map((note) => <article key={note.id} className="rounded-[9px] bg-surface-soft p-3"><p className="text-sm leading-6 text-ink">{note.content}</p><p className="mt-2 text-[11px] text-muted">{note.authorName} · {formatRelativeTime(note.createdAt)}</p></article>) : <p className="text-xs leading-5 text-muted">Chưa có ghi chú nào cho hồ sơ này.</p>}</div></section>;
}
