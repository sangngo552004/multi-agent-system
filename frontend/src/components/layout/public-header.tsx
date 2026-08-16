"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown, LogOut, User as UserIcon, Briefcase } from "lucide-react";

import { useAuth } from "@/features/auth/auth-provider";
import { getInitials } from "@/lib/format";
import { LanguageSwitcher } from "./language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PublicHeader() {
  const t = useTranslations("LandingPage.header");
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
  };

  const getDashboardUrl = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "HR":
        return "/hr/dashboard";
      default:
        return "/profile";
    }
  };

  const navItems = [
    { label: t("home"), href: "#" },
    { label: t("about"), href: "#about" },
    { label: t("jobs"), href: "/jobs" },
    { label: t("contact"), href: "#contact" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      if (href === "#") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 inset-x-0 z-50 backdrop-blur-md bg-white/80 border-b border-border shadow-sm">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 h-16">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center bg-brand text-white font-bold w-8 h-8 rounded-md group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="font-bold text-lg text-ink tracking-tight"><span className="text-brand">PTIT</span> Careers</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-muted hover:text-brand transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-left transition-colors hover:bg-surface-soft border border-transparent hover:border-border cursor-pointer">
                  <span className="grid size-8 place-items-center rounded-full bg-brand/10 text-brand text-xs font-bold">
                    {getInitials(user.fullName)}
                  </span>
                  <span className="hidden sm:block text-sm font-medium text-ink max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                  <ChevronDown className="hidden sm:block size-3.5 text-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={getDashboardUrl()} className="cursor-pointer">
                    <UserIcon className="size-4 mr-2" />
                    {user.role === "CANDIDATE" ? "Hồ sơ của tôi" : "Không gian làm việc"}
                  </Link>
                </DropdownMenuItem>
                {user.role === "CANDIDATE" && (
                  <DropdownMenuItem asChild>
                    <Link href="/profile/applications" className="cursor-pointer">
                      <Briefcase className="size-4 mr-2" />
                      Việc làm đã ứng tuyển
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-danger cursor-pointer">
                  <LogOut className="size-4 mr-2" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/5"
              >
                Đăng ký
              </Link>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
              >
                {t("login")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
