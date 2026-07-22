import type { Metadata } from "next";
import { HrDashboardPage } from "@/features/hr/dashboard/components/dashboard-page";

export const metadata: Metadata = { title: "Tổng quan tuyển dụng" };

export default function HrDashboardRoute() {
  return <HrDashboardPage />;
}
