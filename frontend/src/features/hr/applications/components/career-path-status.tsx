import { BookOpenCheck, CircleAlert, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HrApplicationDetail } from "@/features/hr/applications/applications.types";
import type { CareerPathGenerationStatus } from "@/types/domain/hr";

const presentations: Record<CareerPathGenerationStatus, { label: string; note: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
  NOT_STARTED: { label: "Chưa khởi tạo", note: "Lộ trình chỉ được tạo sau quyết định Không phù hợp.", tone: "neutral" },
  PROCESSING: { label: "Đang tạo", note: "Hệ thống đang tổng hợp khoảng trống năng lực.", tone: "info" },
  READY: { label: "Đã sẵn sàng", note: "Lộ trình hỗ trợ phát triển đã sẵn sàng gửi cho ứng viên.", tone: "success" },
  REVIEW_REQUIRED: { label: "Cần kiểm tra", note: "Nội dung cần được kiểm tra thêm trước khi sử dụng.", tone: "warning" },
  INSUFFICIENT_INPUT: { label: "Không đủ dữ liệu", note: "CV hoặc kết quả AI chưa đủ để tạo lộ trình phù hợp.", tone: "warning" },
  FAILED: { label: "Tạo thất bại", note: "Admin đã nhận trạng thái để hỗ trợ xử lý.", tone: "danger" },
};

export function CareerPathStatus({ application }: { application: HrApplicationDetail }) {
  const item = presentations[application.careerPathStatus];
  const Icon = application.careerPathStatus === "READY" ? BookOpenCheck : application.careerPathStatus === "PROCESSING" ? Clock3 : CircleAlert;
  return <section className="rounded-[12px] border border-border bg-surface p-5"><div className="flex items-start justify-between gap-3"><div><p className="admin-kicker text-muted">Điểm nhấn hệ thống</p><h2 className="mt-2 text-base font-semibold text-ink">Career Path</h2></div><Icon className="size-5 text-brand" /></div><div className="mt-4"><Badge tone={item.tone}>{item.label}</Badge><p className="mt-3 text-xs leading-5 text-muted">{item.note}</p></div><p className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-faint">HR chỉ theo dõi trạng thái. Lộ trình không phải lý do chính thức của quyết định tuyển dụng.</p></section>;
}
