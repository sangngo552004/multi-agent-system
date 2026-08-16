"use client";

import { Check, RotateCcw, ThumbsDown, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { recruitmentStatusMap } from "@/config/status";
import { useUpdateHrApplicationStatus } from "@/features/hr/applications/applications.queries";
import type { HrApplicationDetail } from "@/features/hr/applications/applications.types";
import type { RecruitmentStatus } from "@/types/domain/recruitment";

type Action = { status: RecruitmentStatus; label: string; description: string };

function actionsFor(status: RecruitmentStatus): Action[] {
  if (status === "PENDING" || status === "REVIEWING") return [{ status: "SHORTLISTED", label: "Duyệt hồ sơ", description: "Xác nhận duyệt hồ sơ của ứng viên này." }, { status: "REJECTED", label: "Không phù hợp", description: "Xác nhận hồ sơ chưa phù hợp với vị trí này." }];
  return [];
}

export function ApplicationStatusActions({ application }: { application: HrApplicationDetail }) {
  const t = useTranslations();

  const mutation = useUpdateHrApplicationStatus();
  const [action, setAction] = useState<Action | null>(null);
  const actions = actionsFor(application.recruitmentStatus);

  const confirm = async () => {
    if (!action) return;
    try {
      await mutation.mutateAsync({ applicationId: application.id, status: action.status });
      toast.success(`Đã chuyển sang “${recruitmentStatusMap[action.status].label}”`);
      setAction(null);
    } catch (error) {
      handleApiError(error, t);
    }
  };

  return <>
    <div className="flex flex-wrap gap-2">{actions.map((item, index) => <Button key={item.status} size="sm" variant={item.status === "REJECTED" ? "secondary" : index === 0 ? "primary" : "secondary"} className={item.status === "REJECTED" ? "text-danger" : undefined} onClick={() => setAction(item)}>{item.status === "REJECTED" ? <ThumbsDown className="size-4" /> : item.status === "HIRED" ? <UserRoundCheck className="size-4" /> : item.status === "REVIEWING" && (application.recruitmentStatus === "HIRED" || application.recruitmentStatus === "REJECTED") ? <RotateCcw className="size-4" /> : <Check className="size-4" />}{item.label}</Button>)}</div>
    <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open) setAction(null); }}>
      {action ? <DialogContent title={`${action.label}?`} description={action.description}><div className="mt-5"><div className="flex justify-end gap-2"><DialogClose asChild><Button variant="secondary">Hủy</Button></DialogClose><Button variant={action.status === "REJECTED" ? "danger" : "primary"} onClick={confirm} loading={mutation.isPending}>Xác nhận</Button></div></div></DialogContent> : null}
    </Dialog>
  </>;
}
