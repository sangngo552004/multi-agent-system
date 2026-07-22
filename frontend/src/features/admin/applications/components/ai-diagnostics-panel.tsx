import { FileScan, Gauge, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ApplicationDetail } from "@/features/admin/applications/applications.types";

export function AiDiagnosticsPanel({ application }: { application: ApplicationDetail }) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="admin-kicker text-info">Thông tin vận hành</p><h2 className="mt-1 text-lg font-semibold text-ink">Chẩn đoán xử lý hồ sơ</h2></div>
        {application.errorCode ? <Badge tone="danger">{application.errorCode}</Badge> : <Badge tone="success">Không có lỗi</Badge>}
      </header>
      <div className="grid gap-px bg-border sm:grid-cols-3">
        <Metric icon={FileScan} label="Phương thức đọc" value={application.extractionMethod === "OCR" ? "Nhận dạng hình ảnh" : "Lớp văn bản"} />
        <Metric icon={Gauge} label="Độ tin cậy" value={`${Math.round(application.aiConfidence * 100)}%`} />
        <Metric icon={TriangleAlert} label="Cảnh báo trích xuất" value={`${application.warningCount} cảnh báo`} />
      </div>
      {application.errorMessage ? <div className="border-t border-border bg-danger/[0.035] px-5 py-4"><p className="text-xs font-semibold text-danger">Mô tả lỗi</p><p className="mt-1.5 text-sm leading-6 text-muted">{application.errorMessage}</p></div> : null}
      <div className="flex gap-3 border-t border-border bg-surface-soft/55 px-5 py-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" /><div><p className="text-sm font-semibold text-ink">Giới hạn truy cập dữ liệu ứng viên</p><p className="mt-1 text-xs leading-5 text-muted">Admin chỉ xem trạng thái kỹ thuật. Nội dung CV, điểm đối sánh, nhận xét chuyên môn và lộ trình nghề nghiệp chỉ hiển thị cho HR phụ trách và ứng viên theo đúng vai trò.</p></div></div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof FileScan; label: string; value: string }) {
  return <div className="bg-surface p-5"><Icon className="size-[18px] text-brand" /><p className="mt-4 text-[10px] font-medium uppercase tracking-[0.08em] text-faint">{label}</p><p className="mt-1 text-sm font-semibold text-ink">{value}</p></div>;
}
