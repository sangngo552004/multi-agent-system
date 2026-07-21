import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Không thể tải dữ liệu",
  description = "Đã có lỗi xảy ra. Hãy thử lại sau ít phút.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[12px] border border-dashed border-danger/30 bg-danger/[0.025] px-6 py-12 text-center">
      <CircleAlert className="size-7 text-danger" />
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {onRetry ? <Button className="mt-5" variant="secondary" onClick={onRetry}>Thử lại</Button> : null}
    </div>
  );
}
