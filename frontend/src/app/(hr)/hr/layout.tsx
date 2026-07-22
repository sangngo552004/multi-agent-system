import type { Metadata } from "next";
import { HrShell } from "@/components/layout/hr-shell";

export const metadata: Metadata = {
  title: {
    default: "Tổng quan tuyển dụng",
    template: "%s · HR",
  },
};

export default function HrLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <HrShell>{children}</HrShell>;
}
