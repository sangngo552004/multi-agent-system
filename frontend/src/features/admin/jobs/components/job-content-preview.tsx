import { BriefcaseBusiness, Clock3, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { employmentTypeLabels } from "@/features/admin/jobs/jobs.constants";
import type { JobDetail } from "@/features/admin/jobs/jobs.types";

export function JobContentPreview({ job }: { job: JobDetail }) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-border-strong bg-surface" aria-labelledby="candidate-preview-title">
      <div className="flex items-center justify-between border-b border-border bg-[#f2f5ef] px-5 py-3">
        <p className="admin-kicker text-brand">Bản xem dành cho ứng viên</p>
        <Badge tone="neutral">Bản xem</Badge>
      </div>
      <article className="px-5 py-7 sm:px-8 sm:py-9">
        <header className="border-b border-border pb-7">
          <p className="text-sm font-semibold text-brand">{job.departmentName}</p>
          <h2 id="candidate-preview-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-ink sm:text-[32px]">{job.title}</h2>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-2"><MapPin className="size-4" /> {job.location}</span>
            <span className="inline-flex items-center gap-2"><BriefcaseBusiness className="size-4" /> {employmentTypeLabels[job.employmentType]}</span>
            <span className="inline-flex items-center gap-2"><Clock3 className="size-4" /> {job.careerLevelName ?? "Chưa xác định cấp bậc"}</span>
          </div>
        </header>
        <div className="space-y-8 pt-7">
          <EditorialSection title="Về vị trí này"><p>{job.description}</p></EditorialSection>
          <EditorialSection title="Bạn sẽ phù hợp nếu"><BulletList items={job.requirements} /></EditorialSection>
          <EditorialSection title="Quyền lợi"><BulletList items={job.benefits} accent /></EditorialSection>
        </div>
      </article>
    </section>
  );
}

function EditorialSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h3 className="text-base font-semibold tracking-[-0.015em] text-ink">{title}</h3><div className="mt-3 text-sm leading-7 text-muted">{children}</div></section>;
}

function BulletList({ items, accent }: { items: string[]; accent?: boolean }) {
  return <ul className="space-y-2.5">{items.map((item) => <li key={item} className="grid grid-cols-[8px_1fr] gap-3"><span className={`mt-[10px] size-1.5 rounded-full ${accent ? "bg-signal ring-1 ring-brand/30" : "bg-brand"}`} />{item}</li>)}</ul>;
}
