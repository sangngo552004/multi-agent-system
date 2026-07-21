import { RouteScaffold } from "@/components/scaffold/route-scaffold";

export default function VerifyEmailPage() {
  return (
    <RouteScaffold
      portal="Auth"
      title="Xác minh email"
      description="Nhận và hiển thị kết quả xác minh tài khoản."
    />
  );
}
