import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationsPage } from "@/features/admin/applications/components/applications-page";
import { ApplicationsTableSkeleton } from "@/features/admin/applications/components/applications-table-skeleton";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.admin" });
  return { title: t("applications") };
}

export default function AdminApplicationsPage() { return <Suspense fallback={<div className="overflow-hidden rounded-[12px] border border-border bg-surface"><ApplicationsTableSkeleton /></div>}><ApplicationsPage /></Suspense>; }
