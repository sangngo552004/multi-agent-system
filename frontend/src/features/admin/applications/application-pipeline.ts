import type { AiPipelineStep } from "@/features/admin/applications/applications.types";
import type { AdminApplication } from "@/types/domain/admin";

export function buildAiPipeline(
  application: Pick<
    AdminApplication,
    "aiStatus" | "errorCode" | "errorMessage"
  >,
): AiPipelineStep[] {
  const base: AiPipelineStep[] = [
    {
      id: "RECEIVED",
      label: "Tiếp nhận CV",
      status: "COMPLETED",
      message: "Tệp đã được lưu và kiểm tra định dạng.",
      startedAt: null,
      finishedAt: null,
    },
    {
      id: "EXTRACTION",
      label: "Trích xuất",
      status: "PENDING",
      message: "Đọc thông tin hồ sơ và kinh nghiệm.",
      startedAt: null,
      finishedAt: null,
    },
    {
      id: "MATCHING",
      label: "Đối sánh",
      status: "PENDING",
      message: "So sánh hồ sơ với yêu cầu công việc.",
      startedAt: null,
      finishedAt: null,
    },
    {
      id: "CAREER_PATH",
      label: "Lộ trình nghề nghiệp",
      status: "PENDING",
      message: "Xây đề xuất phát triển cá nhân.",
      startedAt: null,
      finishedAt: null,
    },
    {
      id: "COMPLETED",
      label: "Hoàn tất",
      status: "PENDING",
      message: "Tổng hợp kết quả cuối cùng.",
      startedAt: null,
      finishedAt: null,
    },
  ];

  if (application.aiStatus === "COMPLETED") {
    return base.map((step) => ({
      ...step,
      status: "COMPLETED" as const,
      message:
        step.id === "COMPLETED"
          ? "Kết quả đã sẵn sàng để xem."
          : step.message,
    }));
  }
  if (application.aiStatus === "WAITING") {
    return base;
  }
  if (application.aiStatus === "PROCESSING") {
    return base.map((step, index) =>
      index < 2
        ? { ...step, status: "COMPLETED" }
        : index === 2
          ? {
              ...step,
              status: "ACTIVE",
              message: "Agent đang tính điểm phù hợp.",
            }
          : step,
    );
  }

  const failureIndex = application.errorCode === "INVALID_FILE" ? 1 : 2;
  return base.map((step, index) => {
    if (index < failureIndex) return { ...step, status: "COMPLETED" };
    if (index === failureIndex) {
      return {
        ...step,
        status: "FAILED",
        message:
          application.errorMessage ?? "Bước xử lý không hoàn tất.",
      };
    }
    return {
      ...step,
      status: "SKIPPED",
      message: "Không chạy do bước trước thất bại.",
    };
  });
}
