"use client";

import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogPanel } from "@/features/admin/knowledge/components/catalog-panel";
import { CompetenciesPanel } from "@/features/admin/knowledge/components/competencies-panel";
import { KnowledgeSummary } from "@/features/admin/knowledge/components/knowledge-summary";
import { useKnowledge } from "@/features/admin/knowledge/knowledge.queries";

export function KnowledgePage() {
  const knowledge = useKnowledge();
  if (knowledge.isPending) return <KnowledgeSkeleton />;
  if (knowledge.isError) return <ErrorState description={knowledge.error.message} onRetry={() => knowledge.refetch()} />;

  return <div className="space-y-7">
    <PageHeader eyebrow="Cấu hình nền tảng" title="Kho năng lực" description="Quản lý các nhóm nghề, cấp bậc và năng lực dùng chung cho tin tuyển dụng và kết quả đối sánh." />
    <KnowledgeSummary data={knowledge.data} />
    <Tabs defaultValue="families">
      <TabsList className="overflow-x-auto"><TabsTrigger value="families">Nhóm nghề</TabsTrigger><TabsTrigger value="levels">Cấp bậc nghề nghiệp</TabsTrigger><TabsTrigger value="competencies">Năng lực</TabsTrigger></TabsList>
      <TabsContent value="families"><CatalogPanel kind="JOB_FAMILY" items={knowledge.data.jobFamilies} /></TabsContent>
      <TabsContent value="levels"><CatalogPanel kind="CAREER_LEVEL" items={knowledge.data.careerLevels} /></TabsContent>
      <TabsContent value="competencies"><CompetenciesPanel items={knowledge.data.competencies} /></TabsContent>
    </Tabs>
  </div>;
}

function KnowledgeSkeleton() { return <div className="space-y-7"><div><Skeleton className="h-3 w-32" /><Skeleton className="mt-3 h-10 w-64" /><Skeleton className="mt-3 h-4 w-full max-w-xl" /></div><Skeleton className="h-24 w-full rounded-[12px]" /><Skeleton className="h-[430px] w-full rounded-[12px]" /></div>; }
