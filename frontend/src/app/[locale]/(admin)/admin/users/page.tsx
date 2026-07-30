import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { UsersTableSkeleton } from "@/features/admin/users/components/users-table-skeleton";
import { UsersPage } from "@/features/admin/users/components/users-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.admin" });
  return { title: t("users") };
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="overflow-hidden rounded-[12px] border border-border bg-surface"><UsersTableSkeleton /></div>}>
      <UsersPage />
    </Suspense>
  );
}
