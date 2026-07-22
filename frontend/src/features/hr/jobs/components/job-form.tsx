"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, CircleAlert, Eye, Save, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CompetencyConfiguration } from "@/features/hr/jobs/components/competency-configuration";
import { JobFormPreview } from "@/features/hr/jobs/components/job-form-preview";
import { hrEmploymentTypeLabels } from "@/features/hr/jobs/jobs.constants";
import { hrJobFormSchema, type HrJobFormValues } from "@/features/hr/jobs/jobs.schema";
import type { HrCatalogOptions, HrJobDetail } from "@/features/hr/jobs/jobs.types";
import { useSaveHrJob } from "@/features/hr/jobs/jobs.queries";
import type { SystemUser } from "@/types/domain/recruitment";

function dateInputValue(value?: string) {
  const date = value ? new Date(value) : new Date(Date.now() + 30 * 86_400_000);
  return date.toISOString().slice(0, 10);
}

function defaults(profile: SystemUser, job?: HrJobDetail): HrJobFormValues {
  return {
    title: job?.title ?? "",
    departmentName: job?.departmentName ?? profile.departmentName ?? "",
    location: job?.location ?? profile.workLocation ?? "",
    employmentType: job?.employmentType ?? "FULL_TIME",
    openingsCount: job?.openingsCount ?? 1,
    expiresAt: dateInputValue(job?.expiresAt),
    description: job?.description ?? "",
    requirementsText: job?.requirements.join("\n") ?? "",
    benefitsText: job?.benefits.join("\n") ?? "",
    jobFamilyId: job?.jobFamilyId ?? "",
    careerLevelId: job?.careerLevelId ?? "",
    competencies: job?.competencies ?? [],
  };
}

export function HrJobForm({ profile, catalog, job }: { profile: SystemUser; catalog: HrCatalogOptions; job?: HrJobDetail }) {
  const router = useRouter();
  const mutation = useSaveHrJob();
  const [previewOpen, setPreviewOpen] = useState(false);
  const lockedConfiguration = Boolean(job && job.status !== "DRAFT");
  const form = useForm<HrJobFormValues>({ resolver: zodResolver(hrJobFormSchema), defaultValues: defaults(profile, job) });
  const values = useWatch({ control: form.control });
  const totalWeight = (values.competencies ?? []).reduce((sum, item) => sum + (Number(item?.weight) || 0), 0);
  const readinessIssues = [!values.jobFamilyId && "Chưa chọn nhóm nghề", !values.careerLevelId && "Chưa chọn cấp bậc", !(values.competencies?.length) && "Chưa có năng lực", values.competencies?.length && totalWeight !== 100 && "Tổng trọng số chưa bằng 100%"].filter(Boolean) as string[];

  const submit = (publish: boolean) => form.handleSubmit(async (formValues) => {
    if (publish && readinessIssues.length) {
      toast.error("Tin chưa sẵn sàng để mở tuyển", { description: readinessIssues.join(" · ") });
      return;
    }
    try {
      const saved = await mutation.mutateAsync({ jobId: job?.id, values: formValues, publish });
      toast.success(publish ? "Đã mở tuyển" : job ? "Đã lưu thay đổi" : "Đã lưu bản nháp", { description: saved.title });
      router.push(`/hr/jobs/${saved.id}`);
    } catch (error) {
      toast.error("Không thể lưu tin tuyển dụng", { description: error instanceof Error ? error.message : "Vui lòng thử lại." });
    }
  });

  return (
    <form className="space-y-6" onSubmit={submit(false)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><Link href={job ? `/hr/jobs/${job.id}` : "/hr/jobs"} className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft className="size-4" /> Quay lại</Link><div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" onClick={() => setPreviewOpen(true)}><Eye className="size-4" /> Xem trước</Button><Button type="submit" variant="secondary" loading={mutation.isPending}><Save className="size-4" />{job ? "Lưu thay đổi" : "Lưu bản nháp"}</Button>{!job || job.status === "DRAFT" ? <Button type="button" onClick={submit(true)} loading={mutation.isPending}><Send className="size-4" /> Lưu và mở tuyển</Button> : null}</div></div>
      <header><p className="admin-kicker text-brand">{job ? "Chỉnh sửa tin" : "Nhu cầu tuyển dụng mới"}</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-ink sm:text-[38px]">{job ? job.title : "Tạo tin tuyển dụng"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Hoàn thiện nội dung ứng viên sẽ thấy và cấu hình năng lực để AI đối sánh nhất quán.</p></header>
      {lockedConfiguration ? <div className="flex gap-3 rounded-[10px] border border-info/20 bg-info/[0.04] p-4 text-sm leading-6 text-muted"><CircleAlert className="mt-0.5 size-5 shrink-0 text-info" /><p>Tin đã được sử dụng trong tuyển dụng. Bạn chỉ có thể cập nhật nội dung và hạn tuyển; cấu hình đối sánh được giữ nguyên để bảo toàn kết quả cũ.</p></div> : null}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <FormSection number="01" title="Thông tin nhu cầu" description="Thông tin định danh và phạm vi của vị trí."><div className="grid gap-4 sm:grid-cols-2"><Field label="Tên vị trí" error={form.formState.errors.title?.message}><Input disabled={lockedConfiguration} {...form.register("title")} /></Field><Field label="Đơn vị tuyển dụng" error={form.formState.errors.departmentName?.message}><Input disabled {...form.register("departmentName")} /></Field><Field label="Địa điểm / hình thức làm việc" error={form.formState.errors.location?.message}><Input disabled={lockedConfiguration} {...form.register("location")} /></Field><Field label="Loại hình" error={form.formState.errors.employmentType?.message}><Controller control={form.control} name="employmentType" render={({ field }) => <Select label="Loại hình làm việc" value={field.value} onValueChange={field.onChange} disabled={lockedConfiguration} options={Object.entries(hrEmploymentTypeLabels).map(([value, label]) => ({ value, label }))} />} /></Field><Field label="Số lượng tuyển" error={form.formState.errors.openingsCount?.message}><Input type="number" min={1} disabled={lockedConfiguration} {...form.register("openingsCount", { valueAsNumber: true })} /></Field><Field label="Hạn nhận hồ sơ" error={form.formState.errors.expiresAt?.message}><Input type="date" {...form.register("expiresAt")} /></Field></div></FormSection>
          <FormSection number="02" title="Nội dung tin" description="Mỗi yêu cầu và quyền lợi được viết trên một dòng riêng."><div className="space-y-4"><Field label="Mô tả công việc" error={form.formState.errors.description?.message}><Textarea className="min-h-36" {...form.register("description")} /></Field><Field label="Yêu cầu ứng viên" error={form.formState.errors.requirementsText?.message}><Textarea className="min-h-36" placeholder="Mỗi yêu cầu trên một dòng" {...form.register("requirementsText")} /></Field><Field label="Quyền lợi" error={form.formState.errors.benefitsText?.message}><Textarea className="min-h-32" placeholder="Mỗi quyền lợi trên một dòng" {...form.register("benefitsText")} /></Field></div></FormSection>
          <FormSection number="03" title="Cấu hình đối sánh" description="Chọn khung nghề nghiệp và các năng lực dùng trong đánh giá."><div className="grid gap-4 sm:grid-cols-2"><Field label="Nhóm nghề"><Controller control={form.control} name="jobFamilyId" render={({ field }) => <Select label="Nhóm nghề" value={field.value || "__none"} onValueChange={(value) => field.onChange(value === "__none" ? "" : value)} disabled={lockedConfiguration} options={[{ value: "__none", label: "Chọn nhóm nghề" }, ...catalog.jobFamilies.map((item) => ({ value: item.id, label: item.name }))]} />} /></Field><Field label="Cấp bậc"><Controller control={form.control} name="careerLevelId" render={({ field }) => <Select label="Cấp bậc" value={field.value || "__none"} onValueChange={(value) => field.onChange(value === "__none" ? "" : value)} disabled={lockedConfiguration} options={[{ value: "__none", label: "Chọn cấp bậc" }, ...catalog.careerLevels.map((item) => ({ value: item.id, label: item.name }))]} />} /></Field></div><div className="mt-6 border-t border-border pt-5"><CompetencyConfiguration control={form.control} register={form.register} catalog={catalog} disabled={lockedConfiguration} />{form.formState.errors.competencies?.message ? <p className="mt-2 text-xs text-danger">{form.formState.errors.competencies.message}</p> : null}</div></FormSection>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24"><section className="rounded-[12px] border border-border bg-surface p-5"><p className="admin-kicker text-muted">Mức hoàn thiện</p><div className="mt-4 flex items-center gap-3">{readinessIssues.length ? <CircleAlert className="size-6 text-warning" /> : <CheckCircle2 className="size-6 text-success" />}<div><p className="text-sm font-semibold text-ink">{readinessIssues.length ? "Cần hoàn thiện" : "Sẵn sàng cho AI"}</p><p className="mt-1 text-xs text-muted">{values.competencies?.length ?? 0} năng lực · {totalWeight}% trọng số</p></div></div>{readinessIssues.length ? <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-warning">{readinessIssues.map((issue) => <li key={issue}>· {issue}</li>)}</ul> : <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">Bạn có thể lưu và mở tuyển ngay sau khi kiểm tra nội dung.</p>}</section><section className="rounded-[12px] border border-border bg-[#13291f] p-5 text-white"><p className="admin-kicker text-[#91a398]">Nguyên tắc</p><p className="mt-3 text-sm font-semibold">AI hỗ trợ, HR quyết định</p><p className="mt-2 text-xs leading-5 text-[#a5b6ac]">Trọng số và năng lực giúp kết quả nhất quán, không phải quy tắc tự động loại ứng viên.</p></section></aside>
      </div>
      <JobFormPreview open={previewOpen} onOpenChange={setPreviewOpen} values={values} catalog={catalog} />
    </form>
  );
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) { return <section className="rounded-[12px] border border-border bg-surface"><header className="flex gap-4 border-b border-border px-5 py-4"><span className="text-xs font-semibold text-brand">{number}</span><div><h2 className="text-base font-semibold text-ink">{title}</h2><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div></header><div className="p-5">{children}</div></section>; }
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-ink">{label}</span>{children}{error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : null}</label>; }
