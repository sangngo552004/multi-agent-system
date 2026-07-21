"use client";

import Link from "next/link";
import { EmptyState } from "@/components/data-display/empty-state";
import { ErrorState } from "@/components/data-display/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserActivity } from "@/features/admin/users/users.queries";
import { formatRelativeTime } from "@/lib/format";

export function UserActivityList({ userId }: { userId: string }) {
  const activity = useUserActivity(userId);
  if (activity.isPending) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (activity.isError) return <ErrorState description={activity.error.message} onRetry={() => activity.refetch()} />;
  if (!activity.data?.length) return <EmptyState title="Chưa có hoạt động quản trị" description="Các quyết định liên quan đến tài khoản này sẽ xuất hiện tại đây." />;

  return (
    <ol className="divide-y divide-border rounded-[10px] border border-border">
      {activity.data.map((item) => (
        <li key={item.id} className="flex gap-4 p-4">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />
          <p className="text-sm leading-6 text-muted"><span className="font-semibold text-ink">{item.actorName}</span> {item.description}{" "}{item.targetHref ? <Link href={item.targetHref} className="font-medium text-brand">{item.targetLabel}</Link> : item.targetLabel}<span className="mt-1 block text-[11px] text-faint">{formatRelativeTime(item.createdAt)}</span></p>
        </li>
      ))}
    </ol>
  );
}
