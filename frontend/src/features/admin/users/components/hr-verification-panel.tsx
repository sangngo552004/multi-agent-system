"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, Globe2, Mail, MessageSquareWarning, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { verificationStatusMap } from "@/config/status";
import { useUpdateHrVerification } from "@/features/admin/users/users.queries";
import {
  verificationNoteSchema,
  type VerificationNoteForm,
} from "@/features/admin/users/users.schema";
import type { VerificationDecision } from "@/features/admin/users/users.types";
import type { AdminUser } from "@/types/domain/admin";

const decisionCopy: Record<VerificationDecision, { title: string; description: string; submit: string; defaultNote: string }> = {
  VERIFIED: { title: "Xác minh nhà tuyển dụng", description: "Hồ sơ doanh nghiệp sẽ được đánh dấu đã xác minh.", submit: "Xác nhận duyệt", defaultNote: "Đã đối chiếu và xác nhận thông tin doanh nghiệp hợp lệ." },
  CHANGES_REQUESTED: { title: "Yêu cầu bổ sung", description: "Nhà tuyển dụng cần cập nhật hồ sơ trước khi được xác minh.", submit: "Gửi yêu cầu", defaultNote: "Vui lòng bổ sung tài liệu doanh nghiệp rõ ràng và đầy đủ hơn." },
  REJECTED: { title: "Từ chối xác minh", description: "Hồ sơ hiện tại sẽ bị từ chối. Hãy ghi rõ lý do để dễ theo dõi.", submit: "Xác nhận từ chối", defaultNote: "Thông tin cung cấp chưa đủ cơ sở để xác minh doanh nghiệp." },
};

export function HrVerificationPanel({ user }: { user: AdminUser }) {
  const [decision, setDecision] = useState<VerificationDecision | null>(null);
  const mutation = useUpdateHrVerification();
  const status = verificationStatusMap[user.verificationStatus];
  const form = useForm<VerificationNoteForm>({ resolver: zodResolver(verificationNoteSchema), defaultValues: { note: "" } });

  const openDecision = (nextDecision: VerificationDecision) => {
    form.reset({ note: decisionCopy[nextDecision].defaultNote });
    setDecision(nextDecision);
  };

  const onSubmit = form.handleSubmit(async ({ note }) => {
    if (!decision) return;
    try {
      await mutation.mutateAsync({ userId: user.id, decision, note });
      toast.success("Đã cập nhật xác minh HR", { description: user.fullName });
      setDecision(null);
    } catch (error) {
      toast.error("Không thể cập nhật hồ sơ", { description: error instanceof Error ? error.message : "Vui lòng thử lại." });
    }
  });

  return (
    <section className="rounded-[12px] border border-border bg-surface">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="admin-kicker text-brand">Hồ sơ doanh nghiệp</p>
          <h2 className="mt-1 text-base font-semibold text-ink">Xác minh nhà tuyển dụng</h2>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </header>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Info icon={Building2} label="Tên doanh nghiệp" value={user.companyName ?? "Chưa cung cấp"} />
        <Info icon={Mail} label="Email công việc" value={user.companyEmail ?? "Chưa cung cấp"} />
        <Info icon={Globe2} label="Website" value={user.companyWebsite ?? "Chưa cung cấp"} href={user.companyWebsite} />
        <Info icon={MessageSquareWarning} label="Ghi chú gần nhất" value={user.verificationNote ?? "Chưa có ghi chú"} />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border bg-surface-soft/40 px-5 py-4">
        <Button size="sm" onClick={() => openDecision("VERIFIED")} disabled={mutation.isPending || user.verificationStatus === "VERIFIED"}><Check className="size-4" /> Xác minh</Button>
        <Button size="sm" variant="secondary" onClick={() => openDecision("CHANGES_REQUESTED")} disabled={mutation.isPending || user.verificationStatus === "CHANGES_REQUESTED"}><MessageSquareWarning className="size-4" /> Yêu cầu bổ sung</Button>
        <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => openDecision("REJECTED")} disabled={mutation.isPending || user.verificationStatus === "REJECTED"}><X className="size-4" /> Từ chối</Button>
      </div>

      <Dialog open={decision !== null} onOpenChange={(open) => !open && !mutation.isPending && setDecision(null)}>
        {decision ? (
          <DialogContent title={decisionCopy[decision].title} description={decisionCopy[decision].description}>
            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="verification-note" className="mb-2 block text-xs font-semibold text-ink">Ghi chú quyết định</label>
                <Textarea id="verification-note" {...form.register("note")} />
                {form.formState.errors.note ? <p className="mt-1.5 text-xs text-danger">{form.formState.errors.note.message}</p> : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="ghost" onClick={() => setDecision(null)} disabled={mutation.isPending}>Hủy</Button>
                <Button type="submit" variant={decision === "REJECTED" ? "danger" : "primary"} loading={mutation.isPending}>{decisionCopy[decision].submit}</Button>
              </div>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}

function Info({ icon: Icon, label, value, href }: { icon: typeof Building2; label: string; value: string; href?: string }) {
  return (
    <div className="flex gap-3 rounded-[9px] border border-border/80 p-3.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" />
      <div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.08em] text-faint">{label}</p>{href ? <a href={href} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm font-medium text-brand hover:underline">{value}</a> : <p className="mt-1 text-sm leading-5 text-ink">{value}</p>}</div>
    </div>
  );
}
