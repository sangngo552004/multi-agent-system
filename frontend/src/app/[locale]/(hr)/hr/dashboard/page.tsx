import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { HrDashboardPage } from "@/features/hr/dashboard/components/dashboard-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.hr" });
  return { title: t("dashboard") };
}

export default function HrDashboardRoute() {
  return <HrDashboardPage />;
}
