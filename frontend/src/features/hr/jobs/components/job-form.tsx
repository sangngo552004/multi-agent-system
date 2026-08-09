"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DynamicListInput } from "@/components/ui/dynamic-list-input";
import { RuleSelector } from "@/features/hr/jobs/components/rule-selector";
import { JobAiParserModal } from "@/features/hr/jobs/components/job-ai-parser-modal";
import { CompetencyConfiguration } from "@/features/hr/jobs/components/competency-configuration";
import { JobFormPreview } from "@/features/hr/jobs/components/job-form-preview";
import { hrEmploymentTypeLabels, hrWorkLocationOptions } from "@/features/hr/jobs/jobs.constants";
import { CompetencyFormModal } from "@/features/hr/knowledge-base/components/competency-form-modal";
import { RuleFormModal } from "@/features/hr/knowledge-base/components/rule-form-modal";
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
    location: job?.location ?? profile.workLocation ?? "",
    employmentType: job?.employmentType ?? "FULL_TIME",
    openingsCount: job?.openingsCount ?? 1,
    expiresAt: dateInputValue(job?.expiresAt),
    description: job?.description ?? "",
    requirementsText: job?.requirements ?? [""],
    benefitsText: job?.benefits ?? [""],
    jobFamilyId: job?.jobFamilyId ?? "",
    careerLevelId: job?.careerLevelId ?? "",
    ruleIds: job?.ruleIds ?? [],
    competencies: job?.competencies ?? [],
  };
}

export function HrJobForm({ profile, catalog, job }: { profile: SystemUser; catalog: HrCatalogOptions; job?: HrJobDetail }) {
  const t = useTranslations();

  const router = useRouter();
  const mutation = useSaveHrJob();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [competencyModalOpen, setCompetencyModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const form = useForm<HrJobFormValues>({ resolver: zodResolver(hrJobFormSchema), defaultValues: defaults(profile, job) });
  const values = useWatch({ control: form.control });

  const submit = (publish: boolean) => form.handleSubmit(async (formValues) => {
    try {
      const saved = await mutation.mutateAsync({ jobId: job?.id, values: formValues, publish });
      toast.success(publish ? "Đã mở tuyển" : job ? "Đã lưu thay đổi" : "Đã lưu bản nháp", { description: saved.title });
      router.push(`/hr/jobs/${saved.id}`);
    } catch (error) {
      handleApiError(error, t);
    }
  });

  return (
    <FormProvider {...form}>
    <form className="space-y-6" onSubmit={submit(false)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><Link href={job ? `/hr/jobs/${job.id}` : "/hr/jobs"} className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft className="size-4" /> Quay lại</Link><div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" onClick={() => setPreviewOpen(true)}><Eye className="size-4" /> Xem trước</Button><Button type="submit" variant="secondary" loading={mutation.isPending}><Save className="size-4" />{job ? "Lưu thay đổi" : "Lưu bản nháp"}</Button></div></div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="admin-kicker text-brand">{job ? "Chỉnh sửa tin" : "Nhu cầu tuyển dụng mới"}</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-ink sm:text-[38px]">{job ? job.title : "Tạo tin tuyển dụng"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Hoàn thiện nội dung ứng viên sẽ thấy và cấu hình năng lực để AI đối sánh nhất quán.</p>
        </div>
      </header>
      <div className="space-y-6">
          <FormSection number="01" title="Thông tin nhu cầu" description="Thông tin định danh và phạm vi của vị trí."><div className="grid gap-4 sm:grid-cols-2"><Field label="Tên vị trí" error={form.formState.errors.title?.message}><Input {...form.register("title")} /></Field><Field label="Địa điểm làm việc" error={form.formState.errors.location?.message}><Controller control={form.control} name="location" render={({ field }) => <Select label="Địa điểm làm việc" value={field.value || "__none"} onValueChange={(value) => field.onChange(value === "__none" ? "" : value)} options={[{ value: "__none", label: "Chọn địa điểm làm việc" }, ...hrWorkLocationOptions.map((value) => ({ value, label: value }))]} />} /></Field><Field label="Loại hình" error={form.formState.errors.employmentType?.message}><Controller control={form.control} name="employmentType" render={({ field }) => <Select label="Loại hình làm việc" value={field.value} onValueChange={field.onChange} options={Object.entries(hrEmploymentTypeLabels).map(([value, label]) => ({ value, label }))} />} /></Field><Field label="Số lượng tuyển" error={form.formState.errors.openingsCount?.message}><Input type="number" min={1} {...form.register("openingsCount", { valueAsNumber: true })} /></Field><Field label="Hạn nhận hồ sơ" error={form.formState.errors.expiresAt?.message}><Input type="date" {...form.register("expiresAt")} /></Field></div></FormSection>
          <FormSection number="02" title="Nội dung tin" description="Mỗi yêu cầu và quyền lợi được viết trên một dòng riêng.">
            <div className="space-y-4">
              <Field label="Mô tả công việc" error={form.formState.errors.description?.message}>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />}
                />
              </Field>
              <Field label="Yêu cầu ứng viên">
                <DynamicListInput
                  control={form.control}
                  name="requirementsText"
                  placeholder="Nhập yêu cầu (VD: Tiếng Anh giao tiếp tốt...)"
                  error={form.formState.errors.requirementsText}
                />
              </Field>
              <Field label="Quyền lợi">
                <DynamicListInput
                  control={form.control}
                  name="benefitsText"
                  placeholder="Nhập quyền lợi (VD: Thưởng tháng 13...)"
                  error={form.formState.errors.benefitsText}
                />
              </Field>
            </div>
          </FormSection>
          <FormSection number="03" title="Cấu hình đối sánh" description="Chọn khung nghề nghiệp và các năng lực dùng trong đánh giá.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nhóm nghề">
                <Controller control={form.control} name="jobFamilyId" render={({ field }) => <Select label="Nhóm nghề" value={field.value || "__none"} onValueChange={(value) => field.onChange(value === "__none" ? "" : value)} options={[{ value: "__none", label: "Chọn nhóm nghề" }, ...catalog.jobFamilies.map((item) => ({ value: item.id, label: item.name }))]} />} />
              </Field>
              <Field label="Cấp bậc">
                <Controller control={form.control} name="careerLevelId" render={({ field }) => <Select label="Cấp bậc" value={field.value || "__none"} onValueChange={(value) => field.onChange(value === "__none" ? "" : value)} options={[{ value: "__none", label: "Chọn cấp bậc" }, ...catalog.careerLevels.map((item) => ({ value: item.id, label: item.name }))]} />} />
              </Field>
            </div>
            <div className="mt-6 border-t border-border pt-5"><div className="mb-4 flex items-center justify-between gap-3"><p className="text-xs text-muted">Chưa có năng lực phù hợp?</p><Button type="button" size="sm" variant="secondary" onClick={() => setCompetencyModalOpen(true)}><Plus className="size-4" /> Thêm năng lực</Button></div>
              <CompetencyConfiguration control={form.control} register={form.register} catalog={catalog} />
              {form.formState.errors.competencies?.message ? <p className="mt-2 text-xs text-danger">{form.formState.errors.competencies.message}</p> : null}
            </div>
            <div className="mt-6 border-t border-border pt-5"><div className="mb-4 flex items-center justify-between gap-3"><p className="text-xs text-muted">Tạo luật mới nếu danh sách chưa có điều kiện phù hợp.</p><Button type="button" size="sm" variant="secondary" onClick={() => setRuleModalOpen(true)}><Plus className="size-4" /> Thêm luật thưởng</Button></div>
              <RuleSelector />
            </div>
            <div className="mt-6 border-t border-border pt-5"><JobAiParserModal /></div>
          </FormSection>
      </div>
      <JobFormPreview open={previewOpen} onOpenChange={setPreviewOpen} values={values} catalog={catalog} />
      <CompetencyFormModal isOpen={competencyModalOpen} onClose={() => setCompetencyModalOpen(false)} initialData={null} />
      <RuleFormModal isOpen={ruleModalOpen} onClose={() => setRuleModalOpen(false)} initialData={null} />
    </form>
    </FormProvider>
  );
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) { return <section className="rounded-[12px] border border-border bg-surface"><header className="flex gap-4 border-b border-border px-5 py-4"><span className="text-xs font-semibold text-brand">{number}</span><div><h2 className="text-base font-semibold text-ink">{title}</h2><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div></header><div className="p-5">{children}</div></section>; }
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-ink">{label}</span>{children}{error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : null}</label>; }
