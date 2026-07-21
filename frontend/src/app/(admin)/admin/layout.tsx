import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Tổng quan quản trị",
    template: "%s · Admin",
  },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
