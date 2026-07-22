"use client";

import { ErrorState } from "@/components/data-display/error-state";

export default function HrError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Không thể mở không gian tuyển dụng" description={error.message} onRetry={reset} />;
}
