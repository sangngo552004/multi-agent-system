"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { HrSidebar } from "@/components/layout/hr-sidebar";
import { HrTopbar } from "@/components/layout/hr-topbar";

export function HrShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[252px] lg:block"><HrSidebar /></div>
      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[286px] max-w-[86vw] shadow-float outline-none lg:hidden">
            <Dialog.Title className="sr-only">Điều hướng tuyển dụng</Dialog.Title>
            <HrSidebar onNavigate={() => setMenuOpen(false)} />
            <Dialog.Close className="absolute right-3 top-3 grid size-9 place-items-center rounded-[8px] text-[#9aafa3] transition-colors hover:bg-white/10 hover:text-white" aria-label="Đóng menu"><X className="size-4" /></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="lg:pl-[252px]">
        <HrTopbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
