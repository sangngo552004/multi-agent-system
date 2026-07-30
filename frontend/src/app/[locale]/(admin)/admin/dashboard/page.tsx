import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { DashboardPage } from "@/features/admin/dashboard/components/dashboard-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.admin" });
  return { title: t("dashboard") };
}

export default function AdminDashboardPage() {
  return <DashboardPage />;
}
