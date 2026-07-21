import { AlertTriangle, FileText } from "lucide-react";
import { EmptyState } from "@/components/data-display/empty-state";
import type { ApplicationDetail } from "@/features/admin/applications/applications.types";

export function ExtractionTab({ application }: { application: ApplicationDetail }) {
  if (application.errorCode === "INVALID_FILE") {
    return (
      <EmptyState
        title="Không thể trích xuất CV"
        description="Tệp CV không hợp lệ nên hệ thống chưa tạo được dữ liệu hồ sơ. Ứng viên cần tải lại tệp PDF hoặc DOCX có thể đọc được."
      />
    );
  }

  if (application.aiStatus === "WAITING") {
    return (
      <EmptyState
        title="Đang chờ trích xuất CV"
        description="Hồ sơ đang ở trong hàng đợi xử lý. Dữ liệu trích xuất sẽ xuất hiện khi bước đọc CV hoàn tất."
      />
    );
  }

  return <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
    <div className="space-y-7">
      <Section title="Tóm tắt hồ sơ"><p className="text-sm leading-7 text-muted">{application.personalSummary}</p></Section>
      <Section title="Kinh nghiệm"><Timeline items={application.experiences.map((item) => ({ title: item.role, meta: `${item.company} · ${item.period}`, description: item.summary }))} /></Section>
      <Section title="Học vấn"><Timeline items={application.education.map((item) => ({ title: item.program, meta: `${item.school} · ${item.period}` }))} /></Section>
    </div>
    <div className="space-y-5">
      <section className="rounded-[10px] border border-border bg-surface-soft/40 p-4"><div className="flex items-center gap-2"><FileText className="size-4 text-brand" /><h3 className="text-sm font-semibold text-ink">Thông tin trích xuất</h3></div><dl className="mt-4 space-y-3 text-xs"><Row label="Phương thức" value={application.extractionMethod === "OCR" ? "Nhận dạng hình ảnh" : "Đọc lớp văn bản"} /><Row label="Độ tin cậy" value={`${Math.round(application.aiConfidence * 100)}%`} /><Row label="Ngôn ngữ" value={application.languages.join(", ")} /></dl></section>
      {application.skillGroups.map((group) => <section key={group.group}><h3 className="text-xs font-semibold text-ink">{group.group}</h3><div className="mt-2 flex flex-wrap gap-2">{group.skills.slice(0, 8).map((skill) => <span key={skill} className="rounded-[7px] border border-border bg-surface px-2.5 py-1.5 text-xs text-muted">{skill}</span>)}</div></section>)}
      {application.extractionWarnings.length ? <div className="rounded-[9px] border border-warning/25 bg-warning/[0.05] p-4"><p className="flex items-center gap-2 text-xs font-semibold text-warning"><AlertTriangle className="size-4" />Cảnh báo cần đối chiếu</p><ul className="mt-2 space-y-1 text-xs leading-5 text-muted">{application.extractionWarnings.map((warning) => <li key={warning}>· {warning}</li>)}</ul></div> : null}
    </div>
  </div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section><h3 className="text-base font-semibold text-ink">{title}</h3><div className="mt-3">{children}</div></section>; }
function Timeline({ items }: { items: Array<{ title: string; meta: string; description?: string }> }) { return <ol className="space-y-4">{items.map((item) => <li key={`${item.title}-${item.meta}`} className="border-l-2 border-border pl-4"><p className="text-sm font-semibold text-ink">{item.title}</p><p className="mt-0.5 text-xs text-brand">{item.meta}</p>{item.description ? <p className="mt-2 text-xs leading-6 text-muted">{item.description}</p> : null}</li>)}</ol>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-muted">{label}</dt><dd className="text-right font-medium text-ink">{value}</dd></div>; }
