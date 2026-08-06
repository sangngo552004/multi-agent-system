"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hrPrimaryNavigation, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/cn";

function HrNavLink({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onNavigate} title={item.description} className={cn("group flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-brand text-white" : "text-[#bbcac1] hover:bg-white/8 hover:text-white")}>
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
      <span className="flex-1">{item.label}</span>
      {active ? <span className="size-1.5 rounded-full bg-signal" aria-hidden /> : null}
    </Link>
  );
}

export function HrSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-full flex-col bg-[#102a21] text-white">
      <div className="border-b border-white/10 px-5 py-[22px]">
        <Link href="/hr/dashboard" onClick={onNavigate} className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[10px] bg-signal text-[13px] font-bold text-ink">CO</span>
          <span><span className="block text-[15px] font-semibold tracking-[-0.02em]">CareerOS</span><span className="admin-kicker mt-0.5 block text-[9px] text-[#9aafa3]">Tuyển dụng nội bộ</span></span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Điều hướng tuyển dụng">
        <p className="admin-kicker px-3 pb-2 text-[#91a398]">Không gian HR</p>
        <div className="space-y-1">{hrPrimaryNavigation.map((item) => <HrNavLink key={item.href} item={item} onNavigate={onNavigate} />)}</div>
      </nav>
    </aside>
  );
}
