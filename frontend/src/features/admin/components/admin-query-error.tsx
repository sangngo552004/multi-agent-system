"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/data-display/error-state";
import { Button } from "@/components/ui/button";
import {
  getAdminErrorMessage,
  isAdminErrorRetryable,
} from "@/features/admin/admin-errors";

export function AdminQueryError({
  error,
  title,
  fallbackDescription,
  onRetry,
  retrying,
  action,
  backHref,
  backLabel = "Quay lại danh sách",
}: {
  error: unknown;
  title?: string;
  fallbackDescription?: string;
  onRetry?: () => void;
  retrying?: boolean;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const retryable = isAdminErrorRetryable(error);
  const fallbackAction =
    backHref && !retryable ? (
      <Button asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    ) : undefined;

  return (
    <ErrorState
      title={title}
      description={getAdminErrorMessage(error, fallbackDescription)}
      onRetry={onRetry && retryable ? onRetry : undefined}
      retrying={retrying}
      action={action ?? fallbackAction}
    />
  );
}
