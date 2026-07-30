import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { HrApplicationDetailPage } from "@/features/hr/applications/components/application-detail-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.hr" });
  return { title: t("applicationDetail") };
}

export default async function HrApplicationDetailRoute({ params }: { params: Promise<{ applicationId: string }> }) { const { applicationId } = await params; return <HrApplicationDetailPage applicationId={applicationId} />; }
