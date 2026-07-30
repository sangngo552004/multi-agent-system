"use client";

import { AlertTriangle, FileWarning, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getAdminErrorMessage } from "@/features/admin/admin-errors";
import { getAiFailurePresentation } from "@/features/admin/applications/ai-error-presentation";
import { useRetryApplication } from "@/features/admin/applications/applications.queries";
import type { ApplicationDetail } from "@/features/admin/applications/applications.types";

export function RetryAiPanel({
  application,
}: {
  application: ApplicationDetail;
}) {
  const [open, setOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const retry = useRetryApplication();
  const failure = getAiFailurePresentation(application.errorCode);

  if (
    application.aiStatus === "WAITING" ||
    application.aiStatus === "PROCESSING"
  ) {
    return (
      <div className="rounded-[10px] border border-info/25 bg-info/[0.04] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-info">
          <RefreshCw className="size-4 animate-spin" />
          Quy trình AI đang chạy
        </p>
        <p className="mt-2 text-xs leading-6 text-muted">
          Trạng thái và từng bước xử lý được tự động cập nhật từ máy chủ.
        </p>
      </div>
    );
  }
  if (application.aiStatus !== "FAILED") return null;
  if (!application.canRetry) {
    return (
      <div className="rounded-[10px] border border-danger/25 bg-danger/[0.04] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-danger">
          <FileWarning className="size-4" />
          Không thể chạy lại tự động
        </p>
        <p className="mt-2 text-xs leading-6 text-muted">
          {failure.description}
        </p>
        <span className="mt-3 inline-block text-[11px] font-semibold text-danger">
          Mã tham chiếu: {failure.reference}
        </span>
      </div>
    );
  }

  const startRetry = async () => {
    if (!idempotencyKey) return;
    try {
      const accepted = await retry.mutateAsync({
        applicationId: application.id,
        idempotencyKey,
      });
      setOpen(false);
      setIdempotencyKey(null);
      toast.success("Đã xếp hàng xử lý lại", {
        description: `Lượt chạy ${accepted.runId.slice(0, 8).toUpperCase()}`,
      });
    } catch (error) {
      toast.error("Không thể chạy lại AI", {
        description: getAdminErrorMessage(
          error,
          "Chưa thể xếp hàng xử lý lại. Vui lòng thử lại.",
        ),
      });
    }
  };

  const openDialog = () => {
    setIdempotencyKey(crypto.randomUUID());
    setOpen(true);
  };

  return (
    <>
      <div className="rounded-[10px] border border-warning/25 bg-warning/[0.05] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-warning">
          <AlertTriangle className="size-4" />
          Quy trình AI cần chạy lại
        </p>
        <p className="mt-2 text-xs leading-6 text-muted">
          Lỗi tạm thời không làm thay đổi trạng thái tuyển dụng. Bạn có thể
          khởi động lại quy trình từ đầu.
        </p>
        <Button size="sm" className="mt-4" onClick={openDialog}>
          <RefreshCw className="size-4" />
          Chạy lại AI
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => !retry.isPending && setOpen(next)}
      >
        <DialogContent
          title="Chạy lại quy trình AI?"
          description="Hệ thống sẽ xếp hàng lại các bước trích xuất, đối sánh và lộ trình. Trạng thái tuyển dụng được giữ nguyên."
        >
          <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={retry.isPending}
            >
              Hủy
            </Button>
            <Button onClick={startRetry} loading={retry.isPending}>
              <RefreshCw className="size-4" />
              Xếp hàng xử lý
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
