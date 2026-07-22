import { AlertTriangle, BriefcaseBusiness, FileText, GraduationCap, Languages, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HrApplicationDetail } from "@/features/hr/applications/applications.types";

export function CandidateProfilePanel({ application }: { application: HrApplicationDetail }) {
  return <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
    <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="admin-kicker text-brand">Hồ sơ đã tiếp nhận</p><h2 className="mt-2 text-lg font-semibold text-ink">CV và dữ liệu trích xuất</h2></div><div className="flex items-center gap-3 rounded-[9px] border border-border bg-surface-soft px-3 py-2"><FileText className="size-5 text-brand" /><div><p className="text-xs font-semibold text-ink">CV_{application.candidateName.replaceAll(" ", "_")}.pdf</p><p className="mt-0.5 text-[11px] text-muted">{application.extractionMethod === "OCR" ? "Đọc bằng nhận dạng hình ảnh" : "Đọc từ lớp văn bản"}</p></div></div></div>
    {application.extractionWarnings.length ? <div className="border-b border-warning/20 bg-warning/[0.045] px-5 py-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" /><div><p className="text-sm font-semibold text-ink">Cần đối chiếu với CV gốc</p><ul className="mt-2 space-y-1 text-xs leading-5 text-muted">{application.extractionWarnings.map((warning) => <li key={warning}>· {warning}</li>)}</ul></div></div></div> : null}
    <div className="space-y-7 p-5 sm:p-6">
      <ProfileSection icon={<Sparkles className="size-4" />} title="Tóm tắt hồ sơ"><p className="text-sm leading-7 text-muted">{application.personalSummary}</p></ProfileSection>
      <ProfileSection icon={<BriefcaseBusiness className="size-4" />} title="Kinh nghiệm"><div className="space-y-5">{application.experiences.map((experience) => <article key={`${experience.company}-${experience.period}`} className="border-l-2 border-border pl-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-sm font-semibold text-ink">{experience.role}</p><span className="text-xs text-muted">{experience.period}</span></div><p className="mt-1 text-xs font-medium text-brand">{experience.company}</p><p className="mt-2 text-sm leading-6 text-muted">{experience.summary}</p></article>)}</div></ProfileSection>
      <div className="grid gap-7 md:grid-cols-2"><ProfileSection icon={<GraduationCap className="size-4" />} title="Học vấn">{application.education.map((education) => <div key={`${education.school}-${education.period}`}><p className="text-sm font-semibold text-ink">{education.program}</p><p className="mt-1 text-xs text-muted">{education.school} · {education.period}</p></div>)}</ProfileSection><ProfileSection icon={<Languages className="size-4" />} title="Ngôn ngữ"><div className="flex flex-wrap gap-2">{application.languages.map((language) => <Badge key={language}>{language}</Badge>)}</div></ProfileSection></div>
      <ProfileSection title="Kỹ năng được nhận diện"><div className="space-y-4">{application.skillGroups.map((group) => <div key={group.group}><p className="mb-2 text-xs font-semibold text-muted">{group.group}</p><div className="flex flex-wrap gap-2">{group.skills.map((skill) => <Badge key={skill} tone="brand">{skill}</Badge>)}</div></div>)}</div></ProfileSection>
    </div>
    <div className="border-t border-border bg-surface-soft/50 px-5 py-3 text-[11px] leading-5 text-muted">Trong bản demo, nội dung CV được mô phỏng bằng dữ liệu đã trích xuất. Khi có backend, tệp gốc sẽ dùng đường dẫn có kiểm soát quyền truy cập.</div>
  </section>;
}

function ProfileSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">{icon ? <span className="text-brand">{icon}</span> : null}{title}</h3>{children}</section>;
}
