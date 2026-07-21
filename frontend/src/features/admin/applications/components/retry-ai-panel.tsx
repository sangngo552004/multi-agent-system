"use client";

import { AlertTriangle, FileWarning, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRetryApplication } from "@/features/admin/applications/applications.queries";
import type { ApplicationDetail } from "@/features/admin/applications/applications.types";

type RetryProgress = "IDLE" | "WAITING" | "PROCESSING" | "COMPLETED";

export function RetryAiPanel({ application }: { application: ApplicationDetail }) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<RetryProgress>("IDLE");
  const retry = useRetryApplication();

  const retryFlowVisible = retry.isPending || progress !== "IDLE";

  if (application.aiStatus !== "FAILED" && !retryFlowVisible) return null;
  if (application.aiStatus === "FAILED" && !application.canRetry) return <div className="rounded-[10px] border border-danger/25 bg-danger/[0.04] p-4"><p className="flex items-center gap-2 text-sm font-semibold text-danger"><FileWarning className="size-4" />Không thể chạy lại tự động</p><p className="mt-2 text-xs leading-6 text-muted">Tệp CV không hợp lệ. Ứng viên cần tải lại tệp PDF/DOCX có thể đọc được trước khi hệ thống xử lý.</p><span className="mt-3 inline-block text-[11px] font-semibold text-danger">Mã lỗi: INVALID_FILE</span></div>;

  const startRetry = async () => {
    setProgress("WAITING");
    const timer = window.setTimeout(() => setProgress("PROCESSING"), 650);
    try {
      await retry.mutateAsync(application.id);
      window.clearTimeout(timer);
      setProgress("COMPLETED");
      toast.success("Đã xử lý lại hồ sơ", { description: application.id.toUpperCase() });
      window.setTimeout(() => { setOpen(false); setProgress("IDLE"); }, 500);
    } catch (error) {
      window.clearTimeout(timer);
      setProgress("IDLE");
      toast.error("Không thể chạy lại AI", { description: error instanceof Error ? error.message : "Vui lòng thử lại." });
    }
  };

  const labels: Record<RetryProgress, string> = { IDLE: "Sẵn sàng", WAITING: "Đang xếp hàng", PROCESSING: "Các agent đang xử lý", COMPLETED: "Đã hoàn tất" };

  return <>
    <div className="rounded-[10px] border border-warning/25 bg-warning/[0.05] p-4"><p className="flex items-center gap-2 text-sm font-semibold text-warning"><AlertTriangle className="size-4" />Quy trình AI cần chạy lại</p><p className="mt-2 text-xs leading-6 text-muted">Lỗi tạm thời không làm thay đổi trạng thái tuyển dụng. Bạn có thể khởi động lại quy trình từ đầu.</p><Button size="sm" className="mt-4" onClick={() => setOpen(true)}><RefreshCw className="size-4" />Chạy lại AI</Button></div>
    <Dialog open={open} onOpenChange={(next) => !retry.isPending && setOpen(next)}><DialogContent title="Chạy lại quy trình AI?" description="Hệ thống sẽ thực hiện lại trích xuất, đối sánh và tạo lộ trình. Trạng thái tuyển dụng được giữ nguyên.">
      {progress === "IDLE" ? <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4"><Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={startRetry}><RefreshCw className="size-4" />Bắt đầu xử lý</Button></div> : <div className="mt-6"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-ink">{labels[progress]}</span><span className="text-muted">{progress === "WAITING" ? "1/3" : progress === "PROCESSING" ? "2/3" : "3/3"}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-soft"><div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: progress === "WAITING" ? "33%" : progress === "PROCESSING" ? "66%" : "100%" }} /></div><p className="mt-3 text-xs leading-5 text-muted">Vui lòng giữ hộp thoại mở trong khi demo xử lý.</p></div>}
    </DialogContent></Dialog>
  </>;
}
