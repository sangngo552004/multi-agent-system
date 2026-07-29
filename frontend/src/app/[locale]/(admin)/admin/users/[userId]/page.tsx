import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { UserDetailPage } from "@/features/admin/users/components/user-detail-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.admin" });
  return { title: t("userDetail") };
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserDetailPage userId={userId} />;
}
