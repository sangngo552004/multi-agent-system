import { RouteScaffold } from "@/components/scaffold/route-scaffold";

export default function LoginPage() {
  return (
    <RouteScaffold
      portal="Auth"
      title="Đăng nhập"
      description="Điểm vào dùng chung cho Candidate, HR và Admin."
    />
  );
}
