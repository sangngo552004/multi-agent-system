"use client";

import { Copy, Edit3, Pause, Play, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { useChangeHrJobStatus, useDuplicateHrJob } from "@/features/hr/jobs/jobs.queries";
import type { HrJobDetail } from "@/features/hr/jobs/jobs.types";
import type { JobStatus } from "@/types/domain/recruitment";

type PendingAction = { status: JobStatus; title: string; description: string; confirm: string };

export function HrJobLifecycleActions({ job }: { job: HrJobDetail }) {
  const router = useRouter();
  const changeStatus = useChangeHrJobStatus();
  const duplicate = useDuplicateHrJob();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const runStatusChange = async () => {
    if (!pendingAction) return;
    try {
      await changeStatus.mutateAsync({ jobId: job.id, status: pendingAction.status });
      toast.success(pendingAction.status === "OPEN" ? "Tin đã được mở tuyển" : pendingAction.status === "PAUSED" ? "Tin đã được tạm dừng" : "Tin đã được đóng");
      setPendingAction(null);
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái", { description: error instanceof Error ? error.message : "Vui lòng thử lại." });
    }
  };

  const duplicateJob = async () => {
    try {
      const copy = await duplicate.mutateAsync(job.id);
      toast.success("Đã tạo bản nháp từ tin cũ", { description: "Bạn có thể điều chỉnh cấu hình trước khi mở tuyển." });
      router.push(`/hr/jobs/${copy.id}/edit`);
    } catch (error) {
      toast.error("Không thể nhân bản tin", { description: error instanceof Error ? error.message : "Vui lòng thử lại." });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {job.status !== "CLOSED" ? <Button asChild variant="secondary" size="sm"><Link href={`/hr/jobs/${job.id}/edit`}><Edit3 className="size-4" /> Chỉnh sửa</Link></Button> : null}
        {job.status === "DRAFT" ? <Button size="sm" onClick={() => setPendingAction({ status: "OPEN", title: "Mở tin tuyển dụng?", description: "Tin sẽ hiển thị cho ứng viên và bắt đầu nhận hồ sơ. Cấu hình đối sánh sẽ được khóa để giữ kết quả nhất quán.", confirm: "Mở tuyển" })}><Play className="size-4" /> Mở tuyển</Button> : null}
        {job.status === "OPEN" ? <Button variant="secondary" size="sm" onClick={() => setPendingAction({ status: "PAUSED", title: "Tạm dừng nhận hồ sơ?", description: "Tin tạm thời không nhận hồ sơ mới. Các hồ sơ đã nhận và kết quả đánh giá vẫn được giữ nguyên.", confirm: "Tạm dừng" })}><Pause className="size-4" /> Tạm dừng</Button> : null}
        {job.status === "PAUSED" ? <Button size="sm" onClick={() => setPendingAction({ status: "OPEN", title: "Mở lại tin tuyển dụng?", description: "Tin sẽ tiếp tục hiển thị và nhận hồ sơ mới cho đến hạn tuyển.", confirm: "Mở lại" })}><Play className="size-4" /> Mở lại</Button> : null}
        {job.status === "OPEN" || job.status === "PAUSED" ? <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => setPendingAction({ status: "CLOSED", title: "Đóng tin tuyển dụng?", description: "Tin sẽ ngừng nhận hồ sơ và không thể mở lại. Bạn vẫn có thể xử lý các hồ sơ hiện có hoặc nhân bản tin để tuyển đợt mới.", confirm: "Đóng tin" })}><Square className="size-4" /> Đóng tin</Button> : null}
        {job.status === "CLOSED" ? <Button size="sm" onClick={duplicateJob} loading={duplicate.isPending}><Copy className="size-4" /> Nhân bản thành bản nháp</Button> : null}
      </div>

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        {pendingAction ? <DialogContent title={pendingAction.title} description={pendingAction.description}>
          <div className="mt-6 flex justify-end gap-2"><DialogClose asChild><Button variant="secondary">Hủy</Button></DialogClose><Button variant={pendingAction.status === "CLOSED" ? "danger" : "primary"} loading={changeStatus.isPending} onClick={runStatusChange}>{pendingAction.confirm}</Button></div>
        </DialogContent> : null}
      </Dialog>
    </>
  );
}
