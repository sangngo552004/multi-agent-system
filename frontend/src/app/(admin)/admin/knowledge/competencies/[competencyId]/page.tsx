import { CompetencyDetailPage } from "@/features/admin/knowledge/components/competency-detail-page";

export default async function AdminCompetencyDetailRoute({ params }: { params: Promise<{ competencyId: string }> }) {
  const { competencyId } = await params;
  return <CompetencyDetailPage competencyId={competencyId} />;
}
