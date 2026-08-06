"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { useAuth } from "@/features/auth/auth-provider";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (user.role !== "ADMIN") {
      router.replace(user.role === "HR" ? "/hr/dashboard" : "/profile");
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <p className="text-sm text-muted">Đang kiểm tra quyền truy cập…</p>
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-screen bg-canvas">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[252px] lg:block">
        <AdminSidebar />
      </div>

      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[286px] max-w-[86vw] shadow-float outline-none lg:hidden">
            <Dialog.Title className="sr-only">Điều hướng quản trị</Dialog.Title>
            <AdminSidebar onNavigate={() => setMenuOpen(false)} />
            <Dialog.Close
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-[8px] text-[#9aafa3] hover:bg-white/10 hover:text-white"
              aria-label="Đóng menu"
            >
              <X className="size-4" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="lg:pl-[252px]">
        <AdminTopbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
