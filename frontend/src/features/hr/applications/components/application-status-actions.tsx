"use client";

import { Check, RotateCcw, ThumbsDown, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { recruitmentStatusMap } from "@/config/status";
import { useUpdateHrApplicationStatus } from "@/features/hr/applications/applications.queries";
import type { HrApplicationDetail } from "@/features/hr/applications/applications.types";
import type { RecruitmentStatus } from "@/types/domain/recruitment";

type Action = { status: RecruitmentStatus; label: string; description: string };

const rejectionReasons = [
  { value: "Chưa đáp ứng năng lực bắt buộc", label: "Chưa đáp ứng năng lực bắt buộc" },
  { value: "Kinh nghiệm chưa phù hợp", label: "Kinh nghiệm chưa phù hợp" },
  { value: "Vị trí đã đủ người", label: "Vị trí đã đủ người" },
  { value: "Khác", label: "Lý do khác" },
];

function actionsFor(status: RecruitmentStatus): Action[] {
  if (status === "PENDING" || status === "REVIEWING") return [{ status: "SHORTLISTED", label: "Duyệt hồ sơ", description: "Đưa ứng viên vào danh sách ngắn." }, { status: "REJECTED", label: "Không phù hợp", description: "Đánh dấu hồ sơ không phù hợp." }];
  return [];
}

export function ApplicationStatusActions({ application }: { application: HrApplicationDetail }) {
  const t = useTranslations();

  const mutation = useUpdateHrApplicationStatus();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("__none");
  const actions = actionsFor(application.recruitmentStatus);

  const confirm = async () => {
    if (!action) return;
    if (action.status === "REJECTED" && reason === "__none") { toast.error("Vui lòng chọn lý do không phù hợp."); return; }
    try {
      await mutation.mutateAsync({ applicationId: application.id, status: action.status, reason: action.status === "REJECTED" ? reason : undefined });
      toast.success(`Đã chuyển sang “${recruitmentStatusMap[action.status].label}”`);
      setAction(null);
      setReason("__none");
    } catch (error) {
      handleApiError(error, t);
    }
  };

  return <>
    <div className="flex flex-wrap gap-2">{actions.map((item, index) => <Button key={item.status} size="sm" variant={item.status === "REJECTED" ? "secondary" : index === 0 ? "primary" : "secondary"} className={item.status === "REJECTED" ? "text-danger" : undefined} onClick={() => setAction(item)}>{item.status === "REJECTED" ? <ThumbsDown className="size-4" /> : item.status === "HIRED" ? <UserRoundCheck className="size-4" /> : item.status === "REVIEWING" && (application.recruitmentStatus === "HIRED" || application.recruitmentStatus === "REJECTED") ? <RotateCcw className="size-4" /> : <Check className="size-4" />}{item.label}</Button>)}</div>
    <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open) { setAction(null); setReason("__none"); } }}>
      {action ? <DialogContent title={`${action.label}?`} description={action.description}><div className="mt-5 space-y-4">{action.status === "REJECTED" ? <div><label className="mb-2 block text-xs font-semibold text-ink">Lý do không phù hợp <span className="text-danger">*</span></label><Select label="Lý do không phù hợp" value={reason} onValueChange={setReason} options={[{ value: "__none", label: "Chọn một lý do" }, ...rejectionReasons]} /><p className="mt-2 text-[11px] leading-5 text-muted">Lý do dùng cho lịch sử nội bộ. Không nhập nhận xét nhạy cảm hoặc chủ quan.</p></div> : null}<div className="rounded-[9px] bg-surface-soft p-3 text-xs leading-5 text-muted">AI không thực hiện thao tác này. Quyết định sẽ được ghi nhận dưới tên HR đang đăng nhập.</div><div className="flex justify-end gap-2"><DialogClose asChild><Button variant="secondary">Hủy</Button></DialogClose><Button variant={action.status === "REJECTED" ? "danger" : "primary"} onClick={confirm} loading={mutation.isPending}>Xác nhận</Button></div></div></DialogContent> : null}
    </Dialog>
  </>;
}
