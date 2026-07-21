"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Undo2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateJob } from "@/features/admin/jobs/jobs.queries";
import { rejectJobSchema, type RejectJobForm } from "@/features/admin/jobs/jobs.schema";
import type { JobAction, JobDetail } from "@/features/admin/jobs/jobs.types";

const actionCopy: Record<JobAction, { title: string; description: string; submit: string }> = {
  APPROVE: { title: "Duyệt và đăng tin?", description: "Tin sẽ được hiển thị cho ứng viên ngay sau khi xác nhận.", submit: "Duyệt và đăng" },
  REJECT: { title: "Trả tin về HR?", description: "Tin tiếp tục không công khai. HR cần dựa vào lý do để chỉnh sửa nội dung.", submit: "Xác nhận từ chối" },
  HIDE: { title: "Ẩn tin tuyển dụng?", description: "Ứng viên sẽ không còn nhìn thấy tin, nhưng các hồ sơ đã nộp vẫn được giữ nguyên.", submit: "Xác nhận ẩn" },
  REPUBLISH: { title: "Hiển thị lại tin?", description: "Tin sẽ xuất hiện trở lại trong danh sách việc làm của ứng viên.", submit: "Hiển thị lại" },
};

export function JobActionBar({ job }: { job: JobDetail }) {
  const [action, setAction] = useState<JobAction | null>(null);
  const mutation = useUpdateJob();
  const canModerate = job.status === "PENDING" && job.moderationState === "AWAITING";
  const form = useForm<RejectJobForm>({ resolver: zodResolver(rejectJobSchema), defaultValues: { reason: "" } });

  const execute = async (selectedAction: JobAction, reason?: string) => {
    try {
      await mutation.mutateAsync({ jobId: job.id, action: selectedAction, reason });
      const messages: Record<JobAction, string> = { APPROVE: "Đã duyệt và đăng tin", REJECT: "Đã trả tin về HR", HIDE: "Đã ẩn tin", REPUBLISH: "Đã hiển thị lại tin" };
      toast.success(messages[selectedAction], { description: job.title });
      form.reset();
      setAction(null);
    } catch (error) {
      toast.error("Không thể cập nhật tin", { description: error instanceof Error ? error.message : "Vui lòng thử lại." });
    }
  };

  const confirm = () => {
    if (!action) return;
    if (action === "REJECT") {
      void form.handleSubmit(({ reason }) => execute("REJECT", reason))();
      return;
    }
    void execute(action);
  };

  if (job.status === "CLOSED") {
    return <div className="sticky bottom-4 z-20 rounded-[11px] border border-border bg-surface/95 px-4 py-3 text-sm text-muted shadow-float backdrop-blur">Tin đã đóng nên không còn thao tác kiểm duyệt.</div>;
  }

  return (
    <>
      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[11px] border border-border-strong bg-surface/95 px-4 py-3 shadow-float backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold text-ink">Hành động kiểm duyệt</p><p className="mt-0.5 text-[11px] text-muted">Mọi quyết định được ghi vào nhật ký và trang Tổng quan.</p>{job.status === "PENDING" && job.moderationState === "REJECTED" ? <p className="mt-1 text-[11px] text-warning">Tin đang chờ HR chỉnh sửa và gửi lại để kiểm duyệt.</p> : null}</div>
        <div className="flex flex-wrap gap-2">
          {canModerate ? <><Button size="sm" variant="secondary" onClick={() => setAction("REJECT")}><Undo2 className="size-4" /> Trả về HR</Button><Button size="sm" onClick={() => setAction("APPROVE")} disabled={!job.matchingReady}><Check className="size-4" /> Duyệt và đăng</Button></> : null}
          {job.status === "PUBLISHED" ? <Button size="sm" variant="danger" onClick={() => setAction("HIDE")}><EyeOff className="size-4" /> Ẩn tin</Button> : null}
          {job.status === "HIDDEN" ? <Button size="sm" onClick={() => setAction("REPUBLISH")}><Eye className="size-4" /> Hiển thị lại</Button> : null}
        </div>
        {canModerate && !job.matchingReady ? <p className="text-[11px] text-warning sm:absolute sm:bottom-full sm:right-0 sm:mb-2 sm:rounded-[8px] sm:border sm:border-warning/20 sm:bg-[#fff9ee] sm:px-3 sm:py-2">Chưa thể duyệt vì thiếu cấu hình đối sánh.</p> : null}
      </div>

      <Dialog open={action !== null} onOpenChange={(open) => !open && !mutation.isPending && setAction(null)}>
        {action ? <DialogContent title={actionCopy[action].title} description={actionCopy[action].description}>
          {action === "REJECT" ? <div className="mt-6"><label htmlFor="job-reject-reason" className="mb-2 block text-xs font-semibold text-ink">Lý do gửi HR</label><Textarea id="job-reject-reason" placeholder="Nêu rõ nội dung HR cần chỉnh sửa..." {...form.register("reason")} />{form.formState.errors.reason ? <p className="mt-1.5 text-xs text-danger">{form.formState.errors.reason.message}</p> : null}</div> : null}
          <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => setAction(null)}>Hủy</Button><Button type="button" variant={action === "REJECT" || action === "HIDE" ? "danger" : "primary"} loading={mutation.isPending} onClick={confirm}>{actionCopy[action].submit}</Button></div>
        </DialogContent> : null}
      </Dialog>
    </>
  );
}
