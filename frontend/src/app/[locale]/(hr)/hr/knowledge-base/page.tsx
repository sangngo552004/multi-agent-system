import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { KnowledgeBasePage } from "@/features/hr/knowledge-base/components/knowledge-base-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.hr" });
  return { title: t("knowledgeBase") };
}

export default function HrKnowledgeBaseRoute() {
  return <KnowledgeBasePage />;
}
