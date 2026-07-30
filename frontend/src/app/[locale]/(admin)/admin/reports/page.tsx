import type { Metadata } from "next";
import { ReportsPage } from "@/features/admin/reports/components/reports-page";

export const metadata: Metadata = { title: "Báo cáo tuyển dụng" };

export default function AdminReportsPage() {
  return <ReportsPage />;
}
