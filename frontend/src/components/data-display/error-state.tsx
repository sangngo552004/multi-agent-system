import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Không thể tải dữ liệu",
  description = "Đã có lỗi xảy ra. Hãy thử lại sau ít phút.",
  onRetry,
  retrying = false,
  action,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center rounded-[12px] border border-dashed border-danger/30 bg-danger/[0.025] px-6 py-12 text-center"
      role="alert"
    >
      <CircleAlert className="size-7 text-danger" />
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {onRetry || action ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <Button
              variant="secondary"
              onClick={onRetry}
              loading={retrying}
            >
              Thử lại
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
