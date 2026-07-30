import type { Metadata } from "next";
import { KnowledgePage } from "@/features/admin/knowledge/components/knowledge-page";

export const metadata: Metadata = { title: "Kho năng lực" };

export default function AdminKnowledgePage() {
  return <KnowledgePage />;
}
