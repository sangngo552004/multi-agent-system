"use client";

import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, FileUser, Mail, Shield } from "lucide-react";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { roleMap, userStatusMap } from "@/config/status";
import { StaffProfilePanel } from "@/features/admin/users/components/staff-profile-panel";
import { UserActivityList } from "@/features/admin/users/components/user-activity-list";
import { UserDetailSkeleton } from "@/features/admin/users/components/user-detail-skeleton";
import { UserStatusDialog } from "@/features/admin/users/components/user-status-dialog";
import { useUser } from "@/features/admin/users/users.queries";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/format";

export function UserDetailPage({ userId }: { userId: string }) {
  const userQuery = useUser(userId);
  if (userQuery.isPending) return <UserDetailSkeleton />;
  if (userQuery.isError) return <ErrorState title="Không thể mở người dùng" description={userQuery.error.message} onRetry={() => userQuery.refetch()} />;
  const user = userQuery.data;
  const status = userStatusMap[user.status];

  return (
    <div className="space-y-7">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-brand"><ArrowLeft className="size-4" /> Quay lại danh sách</Link>
      <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-[14px] bg-brand text-lg font-semibold text-white">{getInitials(user.fullName)}</span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-[-0.035em] text-ink sm:text-[30px]">{user.fullName}</h1><Badge tone="brand">{roleMap[user.role]}</Badge></div>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted"><Mail className="size-4" /> {user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3"><StatusDot label={status.label} tone={status.tone} /><span className="hidden h-5 w-px bg-border sm:block" /><span className="text-xs text-muted">Tham gia {formatDate(user.createdAt)}</span></div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[12px] border border-border bg-surface p-5">
            <Tabs defaultValue="overview">
              <TabsList><TabsTrigger value="overview">Tổng quan</TabsTrigger><TabsTrigger value="activity">Hoạt động</TabsTrigger></TabsList>
              <TabsContent value="overview">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Detail icon={Shield} label="Vai trò hệ thống" value={roleMap[user.role]} />
                  <Detail icon={CalendarDays} label="Lần hoạt động gần nhất" value={formatRelativeTime(user.lastActiveAt)} />
                  <Detail icon={Mail} label="Email đăng nhập" value={user.email} />
                  <Detail icon={CalendarDays} label="Ngày tạo tài khoản" value={formatDate(user.createdAt, "dd MMMM yyyy")} />
                </div>
                {user.blockReason ? <div className="mt-5 rounded-[9px] border border-danger/20 bg-danger/[0.04] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-danger">Lý do khóa gần nhất</p><p className="mt-2 text-sm leading-6 text-ink">{user.blockReason}</p></div> : null}
              </TabsContent>
              <TabsContent value="activity"><UserActivityList userId={user.id} /></TabsContent>
            </Tabs>
          </section>
          {user.role !== "CANDIDATE" ? <StaffProfilePanel user={user} /> : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-[12px] border border-border bg-surface p-5">
            <p className="admin-kicker text-muted">Mức sử dụng</p>
            <div className="mt-4 grid grid-cols-2 divide-x divide-border rounded-[9px] border border-border bg-surface-soft/45 py-4">
              <div className="px-4"><BriefcaseBusiness className="size-4 text-brand" /><strong className="mt-3 block text-2xl tracking-[-0.04em] text-ink">{user.jobsCount}</strong><span className="text-[11px] text-muted">Tin tuyển dụng</span></div>
              <div className="px-4"><FileUser className="size-4 text-info" /><strong className="mt-3 block text-2xl tracking-[-0.04em] text-ink">{user.applicationsCount}</strong><span className="text-[11px] text-muted">Hồ sơ ứng tuyển</span></div>
            </div>
          </section>
          <section className="rounded-[12px] border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Kiểm soát tài khoản</h2>
            <p className="mb-4 mt-1.5 text-xs leading-5 text-muted">Thao tác được ghi vào nhật ký và cập nhật số liệu Dashboard.</p>
            <UserStatusDialog user={user} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof Shield; label: string; value: string }) {
  return <div className="flex gap-3 rounded-[9px] border border-border/80 p-4"><Icon className="mt-0.5 size-4 shrink-0 text-muted" /><div><p className="text-[10px] font-medium uppercase tracking-[0.08em] text-faint">{label}</p><p className="mt-1.5 text-sm font-medium text-ink">{value}</p></div></div>;
}
