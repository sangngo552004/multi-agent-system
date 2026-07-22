"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { hrRouteLabels } from "@/config/navigation";
import { useHrProfile } from "@/features/hr/dashboard/dashboard.queries";
import { HrNotificationMenu } from "@/features/hr/notifications/components/notification-menu";
import { getInitials } from "@/lib/format";

function HrBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).slice(1);
  return (
    <nav className="hidden items-center gap-2 text-xs text-muted sm:flex" aria-label="Breadcrumb">
      <Link href="/hr/dashboard" className="transition-colors hover:text-brand">Tuyển dụng</Link>
      {segments.map((segment, index) => {
        const path = `/hr/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = hrRouteLabels[segment] ?? (isLast ? "Chi tiết" : segment);
        return <span key={path} className="flex items-center gap-2"><span className="text-border-strong">/</span>{isLast ? <span className="font-medium text-ink">{label}</span> : <Link href={path} className="transition-colors hover:text-brand">{label}</Link>}</span>;
      })}
    </nav>
  );
}

export function HrTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const profile = useHrProfile();
  const name = profile.data?.fullName ?? "Đang tải...";
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border bg-canvas/92 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenMenu} className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[9px] border border-border-strong bg-surface text-ink transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden" aria-label="Mở menu"><Menu className="size-5" /></button>
        <HrBreadcrumbs /><span className="text-sm font-semibold text-ink sm:hidden">CareerOS HR</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge tone="signal" className="hidden sm:inline-flex">DEMO</Badge>
        <HrNotificationMenu />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button className="flex cursor-pointer items-center gap-2 rounded-[9px] py-1 pl-1 pr-2 text-left transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><span className="grid size-9 place-items-center rounded-[9px] bg-brand text-xs font-semibold text-white">{profile.data ? getInitials(profile.data.fullName) : "HR"}</span><span className="hidden xl:block"><span className="block max-w-40 truncate text-xs font-semibold text-ink">{name}</span><span className="block max-w-40 truncate text-[10px] text-muted">{profile.data?.jobTitle ?? "Nhân sự tuyển dụng"}</span></span><ChevronDown className="hidden size-3.5 text-muted xl:block" /></button></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild><Link href="/hr/dashboard"><LayoutDashboard className="size-4" /> Không gian tuyển dụng</Link></DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 h-px bg-border" />
            <DropdownMenuItem asChild className="text-danger"><Link href="/"><LogOut className="size-4" /> Về trang chọn vai trò</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
