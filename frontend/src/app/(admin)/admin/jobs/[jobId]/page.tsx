import { RouteScaffold } from "@/components/scaffold/route-scaffold";

export default function AdminJobDetailPage() {
  return (
    <RouteScaffold
      portal="Admin"
      title="Chi tiết việc làm"
      description="Nội dung và cấu hình matching của một Job."
    />
  );
}
