"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  adminPrimaryNavigation,
  adminSecondaryNavigation,
  type NavigationItem,
} from "@/config/navigation";
import { resetDemoData } from "@/mocks/reset-demo";
import { setMockScenario, type MockScenario } from "@/mocks/mock-scenarios";
import { useMockScenario } from "@/hooks/use-mock-scenario";
import { cn } from "@/lib/cn";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const scenario = useMockScenario();

  const handleScenario = async (nextScenario: MockScenario) => {
    setMockScenario(nextScenario);
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast.success("Đã đổi kịch bản demo", {
      description: nextScenario === "normal" ? "Dữ liệu bình thường" : nextScenario === "empty" ? "Trạng thái chưa có dữ liệu" : "Mô phỏng lỗi tổng hợp AI",
    });
    onNavigate?.();
  };

  const handleReset = async () => {
    resetDemoData();
    await queryClient.invalidateQueries();
    toast.success("Đã khôi phục dữ liệu demo");
    onNavigate?.();
  };

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

      <div className="m-3 rounded-[10px] border border-white/10 bg-white/[0.045] p-3">
        <div className="flex items-center justify-between">
          <span className="admin-kicker rounded-full bg-signal px-2 py-1 text-[9px] text-ink">
            Chế độ demo
          </span>
          <ArrowUpRight className="size-4 text-[#789084]" />
        </div>
        <p className="mt-3 text-xs leading-5 text-[#9aafa3]">Dữ liệu giả lập, an toàn để thao tác.</p>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-[8px] bg-black/10 p-1" aria-label="Kịch bản demo">
          {([
            ["normal", "Chuẩn"],
            ["empty", "Trống"],
            ["ai-error", "Lỗi AI"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => handleScenario(value)} className={`rounded-[6px] px-1 py-1.5 text-[10px] font-semibold transition-colors ${scenario === value ? "bg-white text-ink" : "text-[#9aafa3] hover:bg-white/8 hover:text-white"}`}>{label}</button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="mt-3 flex items-center gap-2 text-xs font-medium text-white transition-colors hover:text-signal"
        >
          <RotateCcw className="size-3.5" />
          Khôi phục dữ liệu
        </button>
      </div>
    </aside>
  );
}
