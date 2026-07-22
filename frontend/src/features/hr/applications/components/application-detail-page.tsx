"use client";

import { ArrowLeft, CalendarDays, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/data-display/error-state";
import { StatusDot } from "@/components/ui/status-dot";
import { aiStatusMap, recruitmentStatusMap } from "@/config/status";
import { HrApplicationDetailSkeleton } from "@/features/hr/applications/components/application-detail-skeleton";
import { ApplicationNotes } from "@/features/hr/applications/components/application-notes";
import { ApplicationStatusActions } from "@/features/hr/applications/components/application-status-actions";
import { ApplicationTimeline } from "@/features/hr/applications/components/application-timeline";
import { CandidateProfilePanel } from "@/features/hr/applications/components/candidate-profile-panel";
import { CareerPathStatus } from "@/features/hr/applications/components/career-path-status";
import { MatchingEvidencePanel } from "@/features/hr/applications/components/matching-evidence-panel";
import { TalentPoolAction } from "@/features/hr/applications/components/talent-pool-action";
import { useHrApplication } from "@/features/hr/applications/applications.queries";
import type { HrApplicationDetail } from "@/features/hr/applications/applications.types";
import { formatDate, getInitials } from "@/lib/format";

export function HrApplicationDetailPage({ applicationId }: { applicationId: string }) {
  const query = useHrApplication(applicationId);
  if (query.isPending) return <HrApplicationDetailSkeleton />;
  if (query.isError) return <ErrorState title="Không thể mở hồ sơ" description={query.error.message} onRetry={() => query.refetch()} />;
  const application = query.data;
  const recruitment = recruitmentStatusMap[application.recruitmentStatus];
  const ai = aiStatusMap[application.aiStatus];
  return <div className="space-y-7">
    <Link href="/hr/applications" className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-brand"><ArrowLeft className="size-4" /> Quay lại danh sách hồ sơ</Link>
    <header className="flex flex-col gap-5 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between"><div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-brand text-sm font-semibold text-white">{getInitials(application.candidateName)}</span><div><p className="admin-kicker text-brand">Ứng tuyển · {application.jobTitle}</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-ink sm:text-[38px]">{application.candidateName}</h1><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-2"><Mail className="size-4" />{application.candidateEmail}</span><span className="inline-flex items-center gap-2"><MapPin className="size-4" />{application.jobLocation}</span><span className="inline-flex items-center gap-2"><CalendarDays className="size-4" />Nộp {formatDate(application.submittedAt, "dd/MM/yyyy · HH:mm")}</span></div></div></div><div className="flex flex-col items-start gap-3 lg:items-end"><div className="flex flex-wrap gap-4"><StatusDot label={recruitment.label} tone={recruitment.tone} /><StatusDot label={`AI: ${ai.label}`} tone={ai.tone} /></div><ApplicationStatusActions application={application} /></div></header>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_340px]"><main className="min-w-0 space-y-6"><CandidateProfilePanel application={application} /><MatchingEvidencePanel application={application} /></main><aside className="space-y-4 xl:sticky xl:top-24"><DecisionSummary application={application} /><TalentPoolAction application={application} /><ApplicationNotes application={application} /><ApplicationTimeline application={application} /><CareerPathStatus application={application} /></aside></div>
  </div>;
}

function DecisionSummary({ application }: { application: HrApplicationDetail }) {
  return <section className="rounded-[12px] border border-border bg-surface p-5"><p className="admin-kicker text-muted">Tóm tắt đánh giá</p><div className="mt-4 flex items-end justify-between"><div><p className="text-xs text-muted">Điểm đối sánh</p><p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-ink">{application.matchScore ?? "—"}<span className="text-sm text-muted">{application.matchScore === undefined ? "" : "/100"}</span></p></div><div className="text-right"><p className="text-xs text-muted">Độ tin cậy</p><p className="mt-1 text-lg font-semibold text-ink">{Math.round(application.aiConfidence * 100)}%</p></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-soft"><div className="h-full rounded-full bg-signal" style={{ width: `${application.matchScore ?? 0}%` }} /></div><p className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-muted">Điểm số không phải tiêu chí duy nhất để chọn hoặc loại hồ sơ.</p></section>;
}
