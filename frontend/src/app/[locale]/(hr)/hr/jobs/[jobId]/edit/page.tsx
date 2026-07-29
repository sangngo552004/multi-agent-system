import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { HrEditJobFormPage } from "@/features/hr/jobs/components/job-form-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.hr" });
  return { title: t("jobDetail") };
}

export default async function HrEditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <HrEditJobFormPage jobId={jobId} />;
}
