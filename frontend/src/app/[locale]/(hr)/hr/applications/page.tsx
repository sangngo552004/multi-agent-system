import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { HrApplicationsPage } from "@/features/hr/applications/components/applications-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.hr" });
  return { title: t("applications") };
}

export default function HrApplicationsRoute() { return <HrApplicationsPage />; }
