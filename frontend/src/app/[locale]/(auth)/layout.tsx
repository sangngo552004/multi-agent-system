import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.auth" });
  return {
    title: {
      template: t("titleTemplate"),
      default: "Authentication",
    },
  };
}

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
