"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/data-display/error-state";

export default function ErrorPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <ErrorState title="Trang quản trị gặp sự cố" description="Không thể hiển thị nội dung lúc này. Dữ liệu demo của bạn vẫn được giữ nguyên." onRetry={unstable_retry} />;
}
