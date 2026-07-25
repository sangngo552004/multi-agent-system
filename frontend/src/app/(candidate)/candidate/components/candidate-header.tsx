"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Bell } from "lucide-react";

export function CandidateHeader() {
  const pathname = usePathname();

  const brand = "TalentMatch";
  const initials = "VD";
  
  const navItems = [
    { label: "Dashboard", href: "/candidate/dashboard" },
    { label: "Analysis", href: "/candidate/profile" },
    { label: "Jobs", href: "/candidate/jobs" },
    { label: "Settings", href: "/candidate/settings" },
  ];

  return (
    <header className="sticky top-0 inset-x-0 z-50 backdrop-blur-md bg-white/70 border-b border-[#E4E6EC]">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 h-16">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <img src="/icons/logo.png" alt="logo" width={24} height={24} />
          <span className="font-semibold text-[17px]">{brand}</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#44474F]">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={
                  isActive
                    ? "text-[#4F46E5] font-medium"
                    : "hover:text-[#4F46E5] transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-[#EEF0F5] text-[#44474F] transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#5B21B6] font-semibold text-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
