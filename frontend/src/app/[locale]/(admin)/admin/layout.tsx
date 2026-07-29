import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin-shell";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.admin" });
  return {
    title: {
      template: t("titleTemplate"),
      default: t("dashboard"),
    },
  };
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
