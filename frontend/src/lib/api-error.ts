import { toast } from "sonner";
import { ApiError } from "@/services/http/api-client";

export function handleApiError(error: unknown, t?: (key: string) => string) {
  if (error instanceof ApiError && error.code) {
    // Nếu có hàm t (useTranslations) truyền vào, cố gắng dịch code lỗi
    if (t) {
      try {
        const translatedMsg = t(`Errors.${error.code}`);
        // Nếu next-intl không tìm thấy key, nó thường trả về lại key (ví dụ: "Errors.JOB_NOT_FOUND")
        if (translatedMsg && !translatedMsg.includes("Errors.")) {
          toast.error(translatedMsg);
          return;
        }
      } catch {
        // Fallback
      }
    }
  }

  // Fallback về error.message mặc định từ backend hoặc thông báo chung
  toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.");
}
