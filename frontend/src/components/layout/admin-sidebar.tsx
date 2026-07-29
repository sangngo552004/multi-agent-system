"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  adminPrimaryNavigation,
  adminSecondaryNavigation,
  type NavigationItem,
} from "@/config/navigation";
import { cn } from "@/lib/cn";

function NavLink({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-brand text-white" : "text-[#bbcac1] hover:bg-white/8 hover:text-white",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
      <span className="flex-1">{item.label}</span>
      {active ? <span className="size-1.5 rounded-full bg-signal" aria-hidden /> : null}
    </Link>
  );
}

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-full flex-col bg-[#102a21] text-white">
      <div className="border-b border-white/10 px-5 py-[22px]">
        <Link href="/admin/dashboard" onClick={onNavigate} className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[10px] bg-signal text-[13px] font-bold text-ink">
            CO
          </span>
          <span>
            <span className="block text-[15px] font-semibold tracking-[-0.02em]">CareerOS</span>
            <span className="admin-kicker mt-0.5 block text-[9px] text-[#9aafa3]">
              Bảng quản trị
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5" aria-label="Điều hướng quản trị">
        <div>
          <p className="admin-kicker px-3 pb-2 text-[#91a398]">
            Vận hành
          </p>
          <div className="space-y-1">
            {adminPrimaryNavigation.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        <div>
          <p className="admin-kicker px-3 pb-2 text-[#91a398]">
            Theo dõi
          </p>
          <div className="space-y-1">
            {adminSecondaryNavigation.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>

    </aside>
  );
}
