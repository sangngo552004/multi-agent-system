"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import {
  getAdminErrorMessage,
  isAdminErrorRetryable,
} from "@/features/admin/admin-errors";

export function AdminInlineError({
  error,
  fallbackDescription,
  onRetry,
  retrying = false,
}: {
  error: unknown;
  fallbackDescription: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const canRetry = onRetry && isAdminErrorRetryable(error);

  return (
    <div
      className="flex flex-col gap-2 border-b border-warning/20 bg-warning/[0.045] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-5"
      role="alert"
    >
      <p className="flex items-start gap-2 leading-5 text-muted">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
        {getAdminErrorMessage(error, fallbackDescription)}
      </p>
      {canRetry ? (
        <button
          type="button"
          className="inline-flex w-fit items-center gap-1.5 font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onRetry}
          disabled={retrying}
        >
          <RefreshCw
            className={`size-3.5 ${retrying ? "animate-spin" : ""}`}
          />
          Tải lại bộ lọc
        </button>
      ) : null}
    </div>
  );
}
