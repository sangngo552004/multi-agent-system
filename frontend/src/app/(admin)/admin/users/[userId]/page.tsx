import { RouteScaffold } from "@/components/scaffold/route-scaffold";

export default function AdminUserDetailPage() {
  return (
    <RouteScaffold
      portal="Admin"
      title="Chi tiết người dùng"
      description="Thông tin, trạng thái và hoạt động của một tài khoản."
    />
  );
}
