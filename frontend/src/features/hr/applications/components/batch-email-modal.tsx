"use client";

import { useEffect, useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiRequest as fetchApi } from "@/services/http/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { hrQueryKeys } from "@/services/query-keys";
import { useHrApplications } from "@/features/hr/applications/applications.queries";

export function BatchEmailModal({ jobId }: { jobId: string }) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState("REJECTED");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ total: number; processed: number; success: number; failed: number } | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const queryClient = useQueryClient();
  const applications = useHrApplications({ jobId });
  const recipientIds = (applications.data ?? [])
    .filter((application) => application.recruitmentStatus === targetStatus)
    .map((application) => application.id);

  // Polling logic
  useEffect(() => {
    if (!trackingId) return;

    const poll = async () => {
      try {
        const res = await fetchApi<Record<string, unknown>>(`/api/v1/hr/applications/batch-email/${trackingId}`);
        setProgress({
          total: Number(res.totalCount) || 0,
          processed: Number(res.processedCount) || 0,
          success: Number(res.successCount) || 0,
          failed: Number(res.failedCount) || 0,
        });

        // Nếu xong
        if (res.status === "COMPLETED" || (Number(res.totalCount) > 0 && Number(res.processedCount) === Number(res.totalCount))) {
          setTrackingId(null);
          toast.success("Tiến trình gửi mail đã hoàn tất!");
          queryClient.invalidateQueries({ queryKey: hrQueryKeys.all });
        }
      } catch (error) {
        console.error("Polling error", error);
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [trackingId, queryClient]);

  const handleStart = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Vui lòng nhập Tiêu đề và Nội dung email.");
      return;
    }
    if (!recipientIds.length) {
      toast.error("Không có ứng viên phù hợp với nhóm nhận đã chọn.");
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetchApi<string>("/api/v1/hr/applications/batch-email", {
        method: "POST",
        body: JSON.stringify({
          applicationIds: recipientIds,
          action: targetStatus === "HIRED" ? "INVITE" : "REJECT",
          subjectTemplate: subject,
          bodyTemplate: body
        }),
      });
      const trackingId = res.match(/Tracking ID:\s*([\w-]+)/)?.[1];
      if (!trackingId) throw new Error("Không nhận được mã theo dõi gửi email.");
      setTrackingId(trackingId);
      toast.info("Đã bắt đầu gửi mail...");
    } catch (error: unknown) {
      handleApiError(error, t);
    } finally {
      setIsStarting(false);
    }
  };

  const isComplete = progress && progress.total > 0 && progress.processed === progress.total;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setTrackingId(null);
        setProgress(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="hidden sm:flex">
          <Mail className="mr-2 size-4" /> Gửi Mail Hàng loạt
        </Button>
      </DialogTrigger>
      <DialogContent title="Gửi Email Hàng loạt" className="max-w-md">
        {!trackingId && !isComplete ? (
          <div className="space-y-4 py-4">
            <div>
              <Select
                label="Gửi đến nhóm ứng viên"
                value={targetStatus}
                onValueChange={setTargetStatus}
                options={[
                  { value: "REJECTED", label: "Những người Không Phù Hợp" },
                  { value: "HIRED", label: "Những người Đã Tuyển" }
                ]}
              />
            </div>
            <p className="text-xs text-muted">{applications.isPending ? "Đang tải ứng viên..." : `${recipientIds.length} ứng viên sẽ nhận email.`}</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Tiêu đề Email</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Vd: Thông báo kết quả ứng tuyển..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Nội dung</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Nhập nội dung thư..." rows={5} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="button" onClick={handleStart} loading={isStarting}>
                Bắt đầu gửi
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            {isComplete ? (
              <CheckCircle2 className="mx-auto size-12 text-success" />
            ) : (
              <Loader2 className="mx-auto size-12 animate-spin text-brand" />
            )}
            <h3 className="mt-4 text-lg font-semibold text-ink">
              {isComplete ? "Hoàn tất Gửi Mail" : "Đang xử lý Gửi Mail"}
            </h3>
            {progress && (
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Tiến độ:</span>
                  <span className="font-semibold text-ink">{progress.processed} / {progress.total}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className="h-full bg-brand transition-all duration-500"
                    style={{ width: `${(progress.processed / Math.max(progress.total, 1)) * 100}%` }}
                  />
                </div>
                <div className="mt-4 flex justify-center gap-6 pt-4 text-xs">
                  <div className="flex flex-col items-center">
                    <span className="text-success">{progress.success}</span>
                    <span className="text-muted">Thành công</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-danger">{progress.failed}</span>
                    <span className="text-muted">Thất bại</span>
                  </div>
                </div>
              </div>
            )}
            {isComplete && (
              <div className="mt-8">
                <Button onClick={() => setOpen(false)}>Đóng lại</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
