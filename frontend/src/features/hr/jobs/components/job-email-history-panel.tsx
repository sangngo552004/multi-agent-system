"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/services/http/api-client";
import { hrQueryKeys } from "@/services/query-keys";

type BatchEmailJob = {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalCount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  createdAt?: string;
  payload?: { action?: "INVITE" | "REJECT" };
};

const statusTone = {
  PENDING: "warning",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "danger",
} as const;

const statusLabel = {
  PENDING: "Đang chờ",
  PROCESSING: "Đang gửi",
  COMPLETED: "Hoàn tất",
  FAILED: "Thất bại",
} as const;

export function JobEmailHistoryPanel({ jobId }: { jobId: string }) {
  const history = useQuery({
    queryKey: hrQueryKeys.jobEmailHistory(jobId),
    queryFn: () => apiRequest<BatchEmailJob[]>(`/api/v1/hr/applications/batch-email?jobId=${jobId}`),
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });
  const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

  return <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
    <header className="border-b border-border p-5"><p className="admin-kicker text-muted">Theo dõi gửi mail</p><h2 className="mt-1 text-lg font-semibold text-ink">Các đợt gửi của vị trí này</h2><p className="mt-1 text-xs text-muted">Bảng tự cập nhật trạng thái mỗi 5 giây.</p></header>
    <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-surface-hover text-xs text-muted"><tr><th className="px-5 py-3 font-medium">Thời điểm</th><th className="px-3 py-3 font-medium">Loại mail</th><th className="px-3 py-3 font-medium">Trạng thái</th><th className="px-3 py-3 font-medium">Tiến độ</th><th className="px-5 py-3 text-right font-medium">Kết quả</th></tr></thead><tbody>
      {history.isPending ? <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">Đang tải lịch sử gửi mail…</td></tr> : null}
      {history.isError ? <tr><td colSpan={5} className="px-5 py-8 text-center text-danger">Không thể tải lịch sử gửi mail.</td></tr> : null}
      {!history.isPending && !history.isError && !history.data?.length ? <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">Chưa có đợt gửi mail nào cho vị trí này.</td></tr> : null}
      {history.data?.map((item) => <tr key={item.id} className="border-t border-border"><td className="px-5 py-4 text-xs text-muted">{formatDate(item.createdAt)}</td><td className="px-3 py-4 font-medium text-ink">{item.payload?.action === "REJECT" ? "Thư từ chối" : "Thư mời"}</td><td className="px-3 py-4"><Badge tone={statusTone[item.status] ?? "neutral"}>{statusLabel[item.status] ?? item.status}</Badge></td><td className="px-3 py-4 text-ink">{item.processedCount}/{item.totalCount}</td><td className="px-5 py-4 text-right text-xs"><span className="text-success">{item.successCount} thành công</span>{item.failedCount > 0 ? <span className="ml-2 text-danger">{item.failedCount} thất bại</span> : null}</td></tr>)}
    </tbody></table></div>
  </section>;
}
