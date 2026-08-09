"use client";

import { Menu } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";

export function HrTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border bg-surface/95 px-4 shadow-[0_1px_0_rgba(218,37,29,0.04)] backdrop-blur-md sm:px-6 lg:px-8">
      <button type="button" onClick={onOpenMenu} className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[9px] border border-border-strong bg-surface text-ink transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden" aria-label="Mở menu"><Menu className="size-5" /></button>
      <LanguageSwitcher />
    </header>
  );
}
