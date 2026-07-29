import { RouteScaffold } from "@/components/scaffold/route-scaffold";

export default function RegisterPage() {
  return (
    <RouteScaffold
      portal="Auth"
      title="Đăng ký"
      description="Khởi tạo tài khoản ứng viên. Tài khoản HR và Admin do tổ chức cấp."
    />
  );
}
