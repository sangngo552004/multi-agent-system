import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { JobsPage } from "@/features/admin/jobs/components/jobs-page";
import { JobsTableSkeleton } from "@/features/admin/jobs/components/jobs-table-skeleton";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.admin" });
  return { title: t("jobs") };
}

export default function AdminJobsPage() {
  return (
    <Suspense fallback={<div className="overflow-hidden rounded-[12px] border border-border bg-surface"><JobsTableSkeleton /></div>}>
      <JobsPage />
    </Suspense>
  );
}
