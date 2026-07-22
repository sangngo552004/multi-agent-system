"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, Bot, BriefcaseBusiness, Database, FileUser, RefreshCw, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/data-display/empty-state";
import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/features/admin/activity/activity.queries";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { ActivityEntry, ActivityKind } from "@/types/domain/admin";

type ActivityGroup = "ALL" | "ADMIN" | "CONTENT" | "AI" | "APPLICATION";
const pageLoadedAt = Date.now();

const kindMeta: Record<ActivityKind, { label: string; group: Exclude<ActivityGroup, "ALL">; tone: string; icon: typeof Activity }> = {
  USER_STATUS_CHANGED: { label: "Tài khoản", group: "ADMIN", tone: "bg-danger/8 text-danger", icon: UserRound },
  STAFF_PROFILE_SYNCED: { label: "Hồ sơ nhân sự", group: "ADMIN", tone: "bg-info/8 text-info", icon: RefreshCw },
  JOB_STATUS_CHANGED: { label: "Tin tuyển dụng", group: "CONTENT", tone: "bg-warning/10 text-warning", icon: BriefcaseBusiness },
  AI_RETRY_COMPLETED: { label: "Chạy lại AI", group: "AI", tone: "bg-brand/8 text-brand", icon: Bot },
  KNOWLEDGE_CHANGED: { label: "Kho năng lực", group: "ADMIN", tone: "bg-success/8 text-success", icon: Database },
  JOB_UPDATED: { label: "Cập nhật tin", group: "CONTENT", tone: "bg-warning/10 text-warning", icon: BriefcaseBusiness },
  AI_PROCESSING_FAILED: { label: "Lỗi xử lý AI", group: "AI", tone: "bg-danger/8 text-danger", icon: Bot },
  APPLICATION_STATUS_CHANGED: { label: "Cập nhật hồ sơ", group: "APPLICATION", tone: "bg-info/8 text-info", icon: FileUser },
  APPLICATION_SUBMITTED: { label: "Hồ sơ mới", group: "APPLICATION", tone: "bg-info/8 text-info", icon: FileUser },
};

const groupOptions = [
  { value: "ALL", label: "Mọi hoạt động" },
  { value: "ADMIN", label: "Quản trị hệ thống" },
  { value: "CONTENT", label: "Tin tuyển dụng" },
  { value: "APPLICATION", label: "Hồ sơ ứng tuyển" },
  { value: "AI", label: "Xử lý AI" },
];

export function ActivityPage() {
  const activities = useActivities();
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<ActivityGroup>("ALL");
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return (activities.data ?? []).filter((item) => (!keyword || `${item.actorName} ${item.description} ${item.targetLabel}`.toLocaleLowerCase("vi").includes(keyword)) && (group === "ALL" || kindMeta[item.kind].group === group));
  }, [activities.data, group, search]);
  const todayCount = (activities.data ?? []).filter((item) => pageLoadedAt - new Date(item.createdAt).getTime() <= 86_400_000).length;
  const aiCount = (activities.data ?? []).filter((item) => kindMeta[item.kind].group === "AI").length;

  return <div className="space-y-7">
    <PageHeader eyebrow="Dấu vết hệ thống" title="Nhật ký hoạt động" description="Theo dõi các thay đổi quan trọng do Admin, HR nội bộ và hệ thống AI tạo ra." />
    <section className="grid overflow-hidden rounded-[12px] border border-border bg-surface sm:grid-cols-3"><Metric label="Tổng hoạt động" value={activities.data?.length ?? 0} /><Metric label="Trong 24 giờ" value={todayCount} /><Metric label="Liên quan đến AI" value={aiCount} /></section>
    <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm người thực hiện, nội dung hoặc đối tượng..." className="w-full sm:max-w-md" /><Select label="Loại hoạt động" value={group} onValueChange={(value) => setGroup(value as ActivityGroup)} options={groupOptions} /></div>
      {activities.isPending ? <ActivitySkeleton /> : null}
      {activities.isError ? <div className="p-5"><ErrorState description={activities.error.message} onRetry={() => activities.refetch()} /></div> : null}
      {activities.data && filtered.length ? <ol className="divide-y divide-border">{filtered.map((item) => <ActivityRow key={item.id} item={item} />)}</ol> : null}
      {activities.data && !filtered.length ? <EmptyState title="Không có hoạt động phù hợp" description="Thử từ khóa khác hoặc chọn lại loại hoạt động." /> : null}
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="border-b border-border px-5 py-4 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-2xl font-semibold tracking-[-0.04em] text-ink tabular-nums">{value}</p><p className="mt-1 text-xs text-muted">{label}</p></div>; }

function ActivityRow({ item }: { item: ActivityEntry }) {
  const meta = kindMeta[item.kind];
  const Icon = meta.icon;
  return <li className="grid gap-3 px-4 py-4 transition-colors hover:bg-surface-soft/55 sm:grid-cols-[42px_minmax(0,1fr)_140px] sm:items-center sm:px-5"><span className={`grid size-10 place-items-center rounded-[10px] ${meta.tone}`}><Icon className="size-[18px]" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-semibold text-ink">{item.actorName}</span><span className="text-sm text-muted">{item.description}</span>{item.targetHref ? <Link href={item.targetHref} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">{item.targetLabel}<ArrowUpRight className="size-3.5" /></Link> : <span className="text-sm font-semibold text-ink">{item.targetLabel}</span>}</div><span className="mt-1.5 inline-block rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-semibold text-muted">{meta.label}</span></div><div className="sm:text-right"><p className="text-xs font-medium text-ink">{formatRelativeTime(item.createdAt)}</p><p className="mt-1 text-[10px] text-faint">{formatDate(item.createdAt, "HH:mm · dd/MM/yyyy")}</p></div></li>;
}

function ActivitySkeleton() { return <div className="divide-y divide-border">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex gap-4 px-5 py-4"><Skeleton className="size-10 shrink-0 rounded-[10px]" /><div className="flex-1"><Skeleton className="h-4 w-3/5" /><Skeleton className="mt-2 h-3 w-24" /></div></div>)}</div>; }
