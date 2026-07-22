"use client";

import { BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { hrEmploymentTypeLabels } from "@/features/hr/jobs/jobs.constants";
import type { HrJobFormValues } from "@/features/hr/jobs/jobs.schema";
import type { HrCatalogOptions } from "@/features/hr/jobs/jobs.types";

export function JobFormPreview({ open, onOpenChange, values, catalog }: { open: boolean; onOpenChange: (open: boolean) => void; values: Partial<Omit<HrJobFormValues, "competencies">>; catalog: HrCatalogOptions }) {
  const lines = (value?: string) => value?.split("\n").map((item) => item.trim()).filter(Boolean) ?? [];
  const family = catalog.jobFamilies.find((item) => item.id === values.jobFamilyId)?.name;
  const level = catalog.careerLevels.find((item) => item.id === values.careerLevelId)?.name;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl" title="Xem trước nội dung tin" description="Mô phỏng phần thông tin chính ứng viên sẽ đọc trước khi nộp hồ sơ."><div className="mt-5 overflow-hidden rounded-[12px] border border-border"><header className="bg-[#13291f] p-6 text-white"><div className="flex flex-wrap gap-2">{family ? <Badge tone="signal">{family}</Badge> : null}{level ? <Badge tone="neutral" className="border-white/15 bg-white/10 text-white">{level}</Badge> : null}</div><h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{values.title || "Tên vị trí tuyển dụng"}</h2><p className="mt-2 text-sm text-[#a5b6ac]">{values.departmentName || "Đơn vị tuyển dụng"}</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#c2cdc6]"><span className="flex items-center gap-2"><MapPin className="size-4" />{values.location || "Chưa có địa điểm"}</span><span className="flex items-center gap-2"><BriefcaseBusiness className="size-4" />{values.employmentType ? hrEmploymentTypeLabels[values.employmentType] : "Chưa chọn loại hình"}</span><span className="flex items-center gap-2"><CalendarDays className="size-4" />Hạn {values.expiresAt || "chưa chọn"}</span></div></header><div className="space-y-6 p-6"><PreviewSection title="Mô tả công việc"><p>{values.description || "Chưa có nội dung mô tả."}</p></PreviewSection><PreviewSection title="Yêu cầu ứng viên"><PreviewList items={lines(values.requirementsText)} empty="Chưa có yêu cầu." /></PreviewSection><PreviewSection title="Quyền lợi"><PreviewList items={lines(values.benefitsText)} empty="Chưa có quyền lợi." /></PreviewSection></div></div><div className="mt-5 flex justify-end"><DialogClose asChild><Button variant="secondary">Đóng xem trước</Button></DialogClose></div></DialogContent></Dialog>;
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) { return <section><h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3><div className="whitespace-pre-line text-sm leading-7 text-muted">{children}</div></section>; }
function PreviewList({ items, empty }: { items: string[]; empty: string }) { return items.length ? <ul className="space-y-1">{items.map((item) => <li key={item}>· {item}</li>)}</ul> : <p>{empty}</p>; }
