import { recruitmentStatusMap } from "@/config/status";
import type { HrJobDetail } from "@/features/hr/jobs/jobs.types";
import type { RecruitmentStatus } from "@/types/domain/recruitment";
import Link from "next/link";

const order: RecruitmentStatus[] = ["PENDING", "REVIEWING", "SHORTLISTED", "HIRED", "REJECTED"];

export function JobPipelinePanel({ job }: { job: HrJobDetail }) {
  const total = Math.max(job.applicationCount, 1);
  return <section className="rounded-[12px] border border-border bg-surface p-5" aria-labelledby="job-pipeline-title"><div><p className="admin-kicker text-info">Tiến độ xử lý</p><h2 id="job-pipeline-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Phễu của vị trí</h2></div><div className="mt-5 space-y-2">{order.map((status) => { const value = job.pipelineCounts[status]; return <Link href={`/hr/applications?jobId=${job.id}&status=${status}`} key={status} className="block rounded-[8px] p-2 transition-colors hover:bg-surface-soft"><div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-muted">{recruitmentStatusMap[status].label}</span><strong className="tabular-nums text-ink">{value}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-surface-soft"><div className="h-full rounded-full bg-brand" style={{ width: `${(value / total) * 100}%` }} /></div></Link>; })}</div></section>;
}
