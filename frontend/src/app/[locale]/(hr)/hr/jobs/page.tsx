import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { HrJobsPage } from "@/features/hr/jobs/components/jobs-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.hr" });
  return { title: t("jobs") };
}

export default function HrJobsRoute() {
  return <HrJobsPage />;
}
