import { RouteScaffold } from "@/components/scaffold/route-scaffold";

export default function AdminDashboardPage() {
  return (
    <RouteScaffold
      portal="Admin"
      title="Tổng quan"
      description="Tổng hợp hoạt động người dùng, việc làm và xử lý AI."
    />
  );
}
