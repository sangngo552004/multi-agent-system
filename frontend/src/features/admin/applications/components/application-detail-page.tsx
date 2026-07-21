"use client";

import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, UserRound } from "lucide-react";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aiStatusMap, recruitmentStatusMap } from "@/config/status";
import { AiProcessRail } from "@/features/admin/applications/components/ai-process-rail";
import { ApplicationDetailSkeleton } from "@/features/admin/applications/components/application-detail-skeleton";
import { CareerPathTab } from "@/features/admin/applications/components/career-path-tab";
import { ExtractionTab } from "@/features/admin/applications/components/extraction-tab";
import { MatchingTab } from "@/features/admin/applications/components/matching-tab";
import { RetryAiPanel } from "@/features/admin/applications/components/retry-ai-panel";
import { useApplication } from "@/features/admin/applications/applications.queries";
import { formatDate } from "@/lib/format";

export function ApplicationDetailPage({ applicationId }: { applicationId: string }) {
  const query = useApplication(applicationId);
  if (query.isPending) return <ApplicationDetailSkeleton />;
  if (query.isError) return <ErrorState title="Không thể mở hồ sơ" description={query.error.message} onRetry={() => query.refetch()} />;
  const application = query.data;
  const recruitment = recruitmentStatusMap[application.recruitmentStatus];
  const ai = aiStatusMap[application.aiStatus];

  return <div className="space-y-7">
    <Link href="/admin/applications" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft className="size-4" />Quay lại danh sách</Link>
    <header className="flex flex-col gap-5 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-[11px] font-bold uppercase tracking-[0.05em] text-brand">{application.id}</p>{application.needsReview ? <Badge tone="warning">Cần kiểm tra</Badge> : null}</div><h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-ink sm:text-[36px]">{application.candidate.fullName}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"><Link href={`/admin/users/${application.candidate.id}`} className="inline-flex items-center gap-2 hover:text-brand"><UserRound className="size-4" />{application.candidate.email}</Link><Link href={`/admin/jobs/${application.job.id}`} className="inline-flex items-center gap-2 hover:text-brand"><BriefcaseBusiness className="size-4" />{application.job.title}</Link><span className="inline-flex items-center gap-2"><CalendarDays className="size-4" />{formatDate(application.submittedAt, "dd/MM/yyyy · HH:mm")}</span></div></div><div className="flex flex-wrap items-center gap-4 rounded-[10px] border border-border bg-surface px-4 py-3"><div><p className="text-[10px] font-semibold text-faint">Tuyển dụng</p><StatusDot className="mt-1" label={recruitment.label} tone={recruitment.tone} /></div><span className="h-9 w-px bg-border" /><div><p className="text-[10px] font-semibold text-faint">Xử lý AI</p><StatusDot className="mt-1" label={ai.label} tone={ai.tone} /></div></div></header>
    <AiProcessRail steps={application.pipeline} />
    <RetryAiPanel application={application} />
    <section className="rounded-[12px] border border-border bg-surface p-5 sm:p-6"><Tabs defaultValue="extraction"><TabsList className="overflow-x-auto"><TabsTrigger value="extraction">Trích xuất CV</TabsTrigger><TabsTrigger value="matching">Kết quả đối sánh</TabsTrigger><TabsTrigger value="career">Lộ trình nghề nghiệp</TabsTrigger></TabsList><TabsContent value="extraction"><ExtractionTab application={application} /></TabsContent><TabsContent value="matching"><MatchingTab application={application} /></TabsContent><TabsContent value="career"><CareerPathTab application={application} /></TabsContent></Tabs></section>
  </div>;
}
