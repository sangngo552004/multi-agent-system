import type { Metadata } from "next";
import { HrShell } from "@/components/layout/hr-shell";
import { HrRouteGuard } from "@/features/auth/hr-route-guard";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.hr" });
  return {
    title: {
      template: t("titleTemplate"),
      default: t("dashboard"),
    },
  };
}

export default function HrLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <HrRouteGuard><HrShell>{children}</HrShell></HrRouteGuard>;
}
