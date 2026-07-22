"use client";

import { Check, RotateCcw, ThumbsDown, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  if (status === "PENDING") return [{ status: "REVIEWING", label: "Bắt đầu xem xét", description: "Đánh dấu hồ sơ đã được HR tiếp nhận và đang đánh giá." }, { status: "REJECTED", label: "Không phù hợp", description: "Kết thúc xử lý hồ sơ này với một lý do ngắn." }];
  if (status === "REVIEWING") return [{ status: "SHORTLISTED", label: "Thêm vào danh sách ngắn", description: "Chọn ứng viên để tiếp tục trao đổi hoặc phỏng vấn bên ngoài hệ thống." }, { status: "REJECTED", label: "Không phù hợp", description: "Kết thúc xử lý hồ sơ này với một lý do ngắn." }];
  if (status === "SHORTLISTED") return [{ status: "HIRED", label: "Đánh dấu đã tuyển", description: "Xác nhận ứng viên đã được chọn cho vị trí này." }, { status: "REJECTED", label: "Không phù hợp", description: "Kết thúc xử lý hồ sơ này với một lý do ngắn." }];
  return [{ status: "REVIEWING", label: "Mở lại xem xét", description: "Hủy quyết định cuối và đưa hồ sơ trở lại bước đang xem xét." }];
}

export function ApplicationStatusActions({ application }: { application: HrApplicationDetail }) {
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
      toast.error("Không thể cập nhật hồ sơ", { description: error instanceof Error ? error.message : "Vui lòng thử lại." });
    }
  };

  return <>
    <div className="flex flex-wrap gap-2">{actions.map((item, index) => <Button key={item.status} size="sm" variant={item.status === "REJECTED" ? "secondary" : index === 0 ? "primary" : "secondary"} className={item.status === "REJECTED" ? "text-danger" : undefined} onClick={() => setAction(item)}>{item.status === "REJECTED" ? <ThumbsDown className="size-4" /> : item.status === "HIRED" ? <UserRoundCheck className="size-4" /> : item.status === "REVIEWING" && (application.recruitmentStatus === "HIRED" || application.recruitmentStatus === "REJECTED") ? <RotateCcw className="size-4" /> : <Check className="size-4" />}{item.label}</Button>)}</div>
    <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open) { setAction(null); setReason("__none"); } }}>
      {action ? <DialogContent title={`${action.label}?`} description={action.description}><div className="mt-5 space-y-4">{action.status === "REJECTED" ? <div><label className="mb-2 block text-xs font-semibold text-ink">Lý do không phù hợp <span className="text-danger">*</span></label><Select label="Lý do không phù hợp" value={reason} onValueChange={setReason} options={[{ value: "__none", label: "Chọn một lý do" }, ...rejectionReasons]} /><p className="mt-2 text-[11px] leading-5 text-muted">Lý do dùng cho lịch sử nội bộ. Không nhập nhận xét nhạy cảm hoặc chủ quan.</p></div> : null}<div className="rounded-[9px] bg-surface-soft p-3 text-xs leading-5 text-muted">AI không thực hiện thao tác này. Quyết định sẽ được ghi nhận dưới tên HR đang đăng nhập.</div><div className="flex justify-end gap-2"><DialogClose asChild><Button variant="secondary">Hủy</Button></DialogClose><Button variant={action.status === "REJECTED" ? "danger" : "primary"} onClick={confirm} loading={mutation.isPending}>Xác nhận</Button></div></div></DialogContent> : null}
    </Dialog>
  </>;
}
