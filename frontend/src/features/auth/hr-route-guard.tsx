"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";

/** Protects the HR workspace after the client-side session has been restored. */
export function HrRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user.role !== "HR") router.replace("/");
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user || user.role !== "HR") {
    return <div className="grid min-h-screen place-items-center bg-canvas text-sm text-muted">Đang xác thực phiên đăng nhập…</div>;
  }
  return <>{children}</>;
}
