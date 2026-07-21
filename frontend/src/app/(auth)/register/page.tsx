import { RouteScaffold } from "@/components/scaffold/route-scaffold";

export default function RegisterPage() {
  return (
    <RouteScaffold
      portal="Auth"
      title="Đăng ký"
      description="Khởi tạo tài khoản Candidate hoặc HR."
    />
  );
}
