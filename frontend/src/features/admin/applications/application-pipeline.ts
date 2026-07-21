import type { AiPipelineStep } from "@/features/admin/applications/applications.types";
import type { AdminApplication } from "@/types/domain/admin";

export function buildAiPipeline(application: AdminApplication): AiPipelineStep[] {
  const base: AiPipelineStep[] = [
    { id: "received", label: "Tiếp nhận CV", status: "COMPLETED", message: "Tệp đã được lưu và kiểm tra định dạng." },
    { id: "extraction", label: "Trích xuất", status: "PENDING", message: "Đọc thông tin hồ sơ và kinh nghiệm." },
    { id: "matching", label: "Đối sánh", status: "PENDING", message: "So sánh hồ sơ với yêu cầu công việc." },
    { id: "career-path", label: "Lộ trình nghề nghiệp", status: "PENDING", message: "Xây đề xuất phát triển cá nhân." },
    { id: "completed", label: "Hoàn tất", status: "PENDING", message: "Tổng hợp kết quả cuối cùng." },
  ];

  if (application.aiStatus === "COMPLETED") {
    return base.map((step) => ({ ...step, status: "COMPLETED" as const, message: step.id === "completed" ? "Kết quả đã sẵn sàng để xem." : step.message }));
  }
  if (application.aiStatus === "WAITING") {
    return base.map((step, index) => index === 1 ? { ...step, status: "ACTIVE", message: "Đang chờ tài nguyên xử lý." } : step);
  }
  if (application.aiStatus === "PROCESSING") {
    return base.map((step, index) => index < 2 ? { ...step, status: "COMPLETED" } : index === 2 ? { ...step, status: "ACTIVE", message: "Agent đang tính điểm phù hợp." } : step);
  }

  const failureIndex = application.errorCode === "INVALID_FILE" ? 1 : 2;
  return base.map((step, index) => {
    if (index < failureIndex) return { ...step, status: "COMPLETED" };
    if (index === failureIndex) return { ...step, status: "FAILED", message: application.errorMessage ?? "Bước xử lý không hoàn tất." };
    return { ...step, status: "SKIPPED", message: "Không chạy do bước trước thất bại." };
  });
}
