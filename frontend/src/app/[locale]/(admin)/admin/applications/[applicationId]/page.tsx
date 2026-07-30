import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ApplicationDetailPage } from "@/features/admin/applications/components/application-detail-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.admin" });
  return { title: t("applicationDetail") };
}

export default async function AdminApplicationDetailRoute({ params }: { params: Promise<{ applicationId: string }> }) { const { applicationId } = await params; return <ApplicationDetailPage applicationId={applicationId} />; }
