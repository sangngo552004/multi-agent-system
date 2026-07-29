import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { JobDetailPage } from "@/features/admin/jobs/components/job-detail-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.admin" });
  return { title: t("jobDetail") };
}

export default async function AdminJobDetailRoute({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <JobDetailPage jobId={jobId} />;
}
