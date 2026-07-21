"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import { routeLabels } from "@/config/navigation";
import { CURRENT_ADMIN_ID } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).slice(1);

  return (
    <nav className="hidden items-center gap-2 text-xs text-muted sm:flex" aria-label="Breadcrumb">
      <Link href="/admin/dashboard" className="transition-colors hover:text-brand">
        Quản trị
      </Link>
      {segments.map((segment, index) => {
        const path = `/admin/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = routeLabels[segment] ?? (isLast ? "Chi tiết" : segment);
        return (
          <span key={path} className="flex items-center gap-2">
            <span className="text-border-strong">/</span>
            {isLast ? (
              <span className="font-medium text-ink">{label}</span>
            ) : (
              <Link href={path} className="transition-colors hover:text-brand">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function AdminTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border bg-canvas/92 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex size-10 items-center justify-center rounded-[9px] border border-border-strong bg-surface text-ink lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="size-5" />
        </button>
        <Breadcrumbs />
        <span className="text-sm font-semibold text-ink sm:hidden">CareerOS Admin</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Badge tone="signal" className="hidden sm:inline-flex">DEMO</Badge>
        <Link
          href="/admin/activity"
          className="relative inline-flex size-10 items-center justify-center rounded-[9px] text-muted transition-colors hover:bg-surface-soft hover:text-ink"
          aria-label="Mở nhật ký hoạt động"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-accent ring-2 ring-canvas" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-[9px] py-1 pl-1 pr-2 text-left transition-colors hover:bg-surface-soft">
              <span className="grid size-9 place-items-center rounded-[9px] bg-brand text-xs font-semibold text-white">AN</span>
              <span className="hidden xl:block">
                <span className="block text-xs font-semibold text-ink">Admin Nguyễn</span>
                <span className="block text-[10px] text-muted">Quản trị viên</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-muted xl:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild><Link href={`/admin/users/${CURRENT_ADMIN_ID}`}><UserRound className="size-4" /> Hồ sơ quản trị viên</Link></DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 h-px bg-border" />
            <DropdownMenuItem asChild className="text-danger"><Link href="/"><LogOut className="size-4" /> Về trang chọn vai trò</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
