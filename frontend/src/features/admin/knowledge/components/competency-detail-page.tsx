"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CompetencyLadder } from "@/features/admin/knowledge/components/competency-ladder";
import { KnowledgeFormDialog } from "@/features/admin/knowledge/components/knowledge-form-dialog";
import { useCompetency } from "@/features/admin/knowledge/knowledge.queries";

export function CompetencyDetailPage({ competencyId }: { competencyId: string }) {
  const competency = useCompetency(competencyId);
  if (competency.isPending) return <DetailSkeleton />;
  if (competency.isError) return <ErrorState title="Không thể mở năng lực" description={competency.error.message} onRetry={() => competency.refetch()} />;
  const item = competency.data;

  return <div className="space-y-7">
    <Link href="/admin/knowledge" className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-brand"><ArrowLeft className="size-4" /> Quay lại kho năng lực</Link>
    <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="admin-kicker text-brand">Thang năng lực</p><Badge tone={item.status === "ACTIVE" ? "success" : "neutral"}>{item.status === "ACTIVE" ? "Đang dùng" : "Tạm ngưng"}</Badge></div><h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-ink sm:text-[38px]">{item.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{item.description}</p><p className="mt-2 text-xs font-medium text-faint">Nhóm: {item.category} · Được dùng trong {item.usageCount} tin tuyển dụng</p></div><KnowledgeFormDialog kind="COMPETENCY" item={item} /></header>
    <CompetencyLadder key={`${item.id}-${item.levels.map((level) => `${level.title}:${level.description}`).join("|")}`} competencyId={item.id} initialLevels={item.levels} />
  </div>;
}

function DetailSkeleton() { return <div className="space-y-7"><Skeleton className="h-4 w-40" /><div><Skeleton className="h-10 w-72" /><Skeleton className="mt-3 h-4 w-full max-w-xl" /></div><div className="grid gap-6 xl:grid-cols-[1.65fr_0.7fr]"><Skeleton className="h-[720px] rounded-[12px]" /><Skeleton className="h-80 rounded-[12px]" /></div></div>; }
