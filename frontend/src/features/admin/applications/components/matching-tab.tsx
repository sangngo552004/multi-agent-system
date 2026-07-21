import { CheckCircle2, Info, XCircle } from "lucide-react";
import type { ApplicationDetail } from "@/features/admin/applications/applications.types";

export function MatchingTab({ application }: { application: ApplicationDetail }) {
  if (!application.scoreBreakdown || application.matchScore === undefined) return <Unavailable title="Chưa có kết quả đối sánh" />;
  const scores = [{ label: "Kỹ năng chuyên môn", value: application.scoreBreakdown.hardSkills }, { label: "Kỹ năng mềm", value: application.scoreBreakdown.softSkills }, { label: "Kinh nghiệm", value: application.scoreBreakdown.experience }];
  return <div className="space-y-7">
    <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center"><div className="rounded-[10px] border border-brand/15 bg-brand/[0.045] p-5 text-center"><span className="text-4xl font-semibold tabular-nums tracking-[-0.05em] text-brand">{application.matchScore}%</span><p className="mt-2 text-xs font-medium text-muted">Điểm phù hợp tổng</p></div><div className="space-y-4">{scores.map((score) => <ScoreBar key={score.label} {...score} />)}</div></div>
    <div className="grid gap-5 md:grid-cols-2"><SkillEvidence title="Năng lực đã khớp" skills={application.matchedSkills} icon={CheckCircle2} tone="success" /><SkillEvidence title="Năng lực còn thiếu" skills={application.missingSkills} icon={XCircle} tone="danger" /></div>
    <div className="rounded-[10px] border border-border bg-surface-soft/45 p-5"><h3 className="text-sm font-semibold text-ink">Nhận định của hệ thống</h3><p className="mt-2 text-sm leading-7 text-muted">{application.aiRecommendation}</p></div>
    <p className="flex gap-2 text-[11px] leading-5 text-faint"><Info className="mt-0.5 size-3.5 shrink-0" />Điểm phù hợp chỉ dùng để hỗ trợ sàng lọc, không thay thế đánh giá trực tiếp của nhà tuyển dụng.</p>
  </div>;
}

function ScoreBar({ label, value }: { label: string; value: number }) { return <div><div className="flex justify-between text-xs"><span className="text-muted">{label}</span><strong className="tabular-nums text-ink">{value}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-soft"><div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} /></div></div>; }
function SkillEvidence({ title, skills, icon: Icon, tone }: { title: string; skills: string[]; icon: typeof CheckCircle2; tone: "success" | "danger" }) { return <section className="rounded-[10px] border border-border p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><Icon className={tone === "success" ? "size-4 text-success" : "size-4 text-danger"} />{title}</h3><div className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-[7px] bg-surface-soft px-2.5 py-1.5 text-xs text-muted">{skill}</span>)}</div></section>; }
function Unavailable({ title }: { title: string }) { return <div className="grid min-h-48 place-items-center rounded-[10px] border border-dashed border-border p-6 text-sm text-muted">{title}</div>; }
