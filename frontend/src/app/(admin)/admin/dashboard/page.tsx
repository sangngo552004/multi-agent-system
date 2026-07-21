import type { Metadata } from "next";
import { DashboardPage } from "@/features/admin/dashboard/components/dashboard-page";

export const metadata: Metadata = { title: "Tổng quan" };

export default function AdminDashboardPage() {
  return <DashboardPage />;
}
