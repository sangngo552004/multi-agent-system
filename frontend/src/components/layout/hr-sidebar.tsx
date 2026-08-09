"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { hrPrimaryNavigation, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/auth-provider";
import { useHrProfile } from "@/features/hr/dashboard/dashboard.queries";
import { getInitials } from "@/lib/format";

function HrNavLink({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  // `usePathname` includes the locale segment (for example `/vi/hr/jobs`),
  // while navigation links are locale-neutral (`/hr/jobs`).
  const active = pathname.endsWith(item.href) || pathname.includes(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onNavigate} title={item.description} className={cn("group flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-brand/[0.06] hover:text-brand")}>
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
      <span className="flex-1">{item.label}</span>
      {active ? <span className="size-1.5 rounded-full bg-white" aria-hidden /> : null}
    </Link>
  );
}

export function HrSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();
  const router = useRouter();
  const profile = useHrProfile();
  const handleLogout = async () => {
    try { await logout(); } catch { /* Logout remains local even if the API fails. */ } finally { router.replace("/login"); }
  };
  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-white text-ink">
      <div className="border-b border-border px-5 py-[22px]">
        <Link href="/hr/dashboard" onClick={onNavigate} className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[10px] bg-brand text-[13px] font-bold text-white">PT</span>
          <span><span className="block text-[15px] font-semibold tracking-[-0.02em]">PTIT Careers</span><span className="admin-kicker mt-0.5 block text-[9px] text-muted">Không gian tuyển dụng</span></span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Điều hướng tuyển dụng">
        <p className="admin-kicker px-3 pb-2 text-faint">Không gian HR</p>
        <div className="space-y-1">{hrPrimaryNavigation.map((item) => <HrNavLink key={item.href} item={item} onNavigate={onNavigate} />)}</div>
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-[10px] bg-surface-soft px-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-brand text-xs font-semibold text-white">{profile.data ? getInitials(profile.data.fullName) : "HR"}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-ink">{profile.data?.fullName ?? "Đang tải..."}</span><span className="mt-0.5 block truncate text-[10px] text-muted">{profile.data?.jobTitle ?? "Nhân sự tuyển dụng"}</span></span>
        </div>
        <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-xs font-semibold text-muted transition-colors hover:bg-danger/[0.06] hover:text-danger"><LogOut className="size-4" /> Đăng xuất</button>
      </div>
    </aside>
  );
}
