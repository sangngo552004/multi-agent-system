import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.candidate" });
  return {
    title: {
      template: t("titleTemplate"),
      default: t("profile"),
    },
  };
}

import { CandidateHeader } from "./components/candidate-header";

export default function CandidateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <CandidateHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
