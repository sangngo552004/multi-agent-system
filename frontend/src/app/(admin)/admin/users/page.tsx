import { RouteScaffold } from "@/components/scaffold/route-scaffold";

export default function AdminUsersPage() {
  return (
    <RouteScaffold
      portal="Admin"
      title="Người dùng"
      description="Quản lý Candidate, HR và tài khoản quản trị."
    />
  );
}
