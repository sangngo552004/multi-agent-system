"use client";

import { Bell, Bot, BriefcaseBusiness, CheckCheck, CircleAlert, FileUser, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useHrNotifications, useMarkAllHrNotificationsRead, useMarkHrNotificationRead } from "@/features/hr/notifications/notifications.queries";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import type { HrNotificationKind } from "@/types/domain/hr";

const icons: Record<HrNotificationKind, LucideIcon> = {
  NEW_APPLICATION: FileUser,
  AI_COMPLETED: Bot,
  AI_FAILED: CircleAlert,
  JOB_EXPIRING: BriefcaseBusiness,
  JOB_INCOMPLETE: BriefcaseBusiness,
  ADMIN_RESOLVED: ShieldCheck,
};
const tones: Record<HrNotificationKind, string> = {
  NEW_APPLICATION: "bg-info/10 text-info",
  AI_COMPLETED: "bg-success/10 text-success",
  AI_FAILED: "bg-danger/10 text-danger",
  JOB_EXPIRING: "bg-warning/10 text-warning",
  JOB_INCOMPLETE: "bg-warning/10 text-warning",
  ADMIN_RESOLVED: "bg-success/10 text-success",
};

export function HrNotificationMenu() {
  const query = useHrNotifications();
  const markRead = useMarkHrNotificationRead();
  const markAll = useMarkAllHrNotificationsRead();
  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-[9px] text-muted transition-colors hover:bg-surface-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`}><Bell className="size-[18px]" />{unreadCount ? <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-white ring-2 ring-canvas">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}</button></DropdownMenuTrigger><DropdownMenuContent className="w-[min(390px,calc(100vw-1rem))] p-0"><div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="text-sm font-semibold text-ink">Thông báo</p><p className="mt-0.5 text-[11px] text-muted">{unreadCount ? `${unreadCount} mục chưa đọc` : "Bạn đã đọc tất cả"}</p></div>{unreadCount ? <button type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="inline-flex cursor-pointer items-center gap-1.5 rounded-[7px] px-2 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50"><CheckCheck className="size-3.5" /> Đọc tất cả</button> : null}</div><div className="max-h-[420px] overflow-y-auto p-1.5">{query.isPending ? <div className="space-y-2 p-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-[8px] bg-surface-soft" />)}</div> : null}{query.isError ? <p className="p-5 text-center text-xs leading-5 text-danger">Không thể tải thông báo. Vui lòng thử lại sau.</p> : null}{query.data?.map((notification) => { const Icon = icons[notification.kind]; return <DropdownMenuItem key={notification.id} asChild className={cn("items-start gap-3 px-3 py-3", !notification.readAt && "bg-brand/[0.035]")}><Link href={notification.href} onClick={() => { if (!notification.readAt) markRead.mutate(notification.id); }}><span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-[9px]", tones[notification.kind])}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex items-start gap-2"><strong className="flex-1 text-xs font-semibold leading-5 text-ink">{notification.title}</strong>{!notification.readAt ? <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" /> : null}</span><span className="mt-0.5 block text-[11px] leading-4 text-muted">{notification.description}</span><span className="mt-1.5 block text-[10px] text-faint">{formatRelativeTime(notification.createdAt)}</span></span></Link></DropdownMenuItem>; })}{query.data && !query.data.length ? <div className="px-5 py-10 text-center"><Bell className="mx-auto size-6 text-faint" /><p className="mt-3 text-sm font-semibold text-ink">Chưa có thông báo</p><p className="mt-1 text-xs text-muted">Các việc cần chú ý sẽ xuất hiện tại đây.</p></div> : null}</div><DropdownMenuSeparator className="h-px bg-border" /><p className="px-4 py-2.5 text-[10px] leading-4 text-muted">Chỉ hiển thị thông báo liên quan đến các vị trí bạn phụ trách.</p></DropdownMenuContent></DropdownMenu>;
}
