"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (nextLocale: string) => {
    if (nextLocale === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex size-10 items-center justify-center rounded-[9px] text-muted transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-50 cursor-pointer"
          aria-label="Chọn ngôn ngữ"
          disabled={isPending}
        >
          <Globe className="size-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLanguageChange("vi")}
          className={`cursor-pointer ${locale === "vi" ? "font-semibold text-brand bg-surface-soft" : ""}`}
        >
          Tiếng Việt
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange("en")}
          className={`cursor-pointer ${locale === "en" ? "font-semibold text-brand bg-surface-soft" : ""}`}
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
