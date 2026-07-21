import type { Metadata } from "next";
import { UserDetailPage } from "@/features/admin/users/components/user-detail-page";

export const metadata: Metadata = { title: "Chi tiết người dùng" };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserDetailPage userId={userId} />;
}
