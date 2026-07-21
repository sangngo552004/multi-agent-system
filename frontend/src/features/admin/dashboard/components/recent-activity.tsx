import Link from "next/link";
import type { ActivityEntry } from "@/types/domain/admin";
import { formatRelativeTime } from "@/lib/format";

export function RecentActivity({ activities }: { activities: ActivityEntry[] }) {
  return (
    <section className="rounded-[12px] border border-border bg-surface p-5" aria-labelledby="recent-activity-title">
      <div className="flex items-center justify-between">
        <div>
          <p className="admin-kicker text-muted">Dấu vết hệ thống</p>
          <h2 id="recent-activity-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Hoạt động gần đây</h2>
        </div>
        <Link href="/admin/activity" className="text-xs font-semibold text-brand hover:underline">Xem tất cả</Link>
      </div>
      <ol className="mt-5 space-y-0">
        {activities.map((activity, index) => (
          <li key={activity.id} className="relative grid grid-cols-[16px_1fr] gap-3 pb-5 last:pb-0">
            {index < activities.length - 1 ? <span className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-px bg-border" /> : null}
            <span className="relative mt-1.5 size-[15px] rounded-full border-[4px] border-surface bg-border-strong ring-1 ring-border" />
            <p className="text-xs leading-5 text-muted">
              <span className="font-semibold text-ink">{activity.actorName}</span> {activity.description}{" "}
              {activity.targetHref ? <Link className="font-medium text-brand hover:underline" href={activity.targetHref}>{activity.targetLabel}</Link> : <span className="font-medium text-ink">{activity.targetLabel}</span>}
              <span className="mt-0.5 block text-[10px] text-faint">{formatRelativeTime(activity.createdAt)}</span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
