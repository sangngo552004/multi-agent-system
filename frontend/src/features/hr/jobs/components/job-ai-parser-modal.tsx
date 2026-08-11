"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { hrWorkLocationOptions } from "@/features/hr/jobs/jobs.constants";
import { apiRequest as fetchApi } from "@/services/http/api-client";
import type { HrJobFormValues } from "../jobs.schema";

type AiJobInfo = {
  title?: string;
  location?: string;
  employmentType?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  jobFamilyId?: string | null;
  careerLevelId?: string | null;
};

type AiCompetencyProposal = {
  competencyId?: string | null;
  name: string;
  category?: string;
  requiredLevel?: number;
  weight?: number;
  isMandatory?: boolean;
  reason?: string;
  status: "MATCHED" | "PROPOSED_NEW";
};

type AiRuleSuggestion = {
  ruleId: string;
  reason?: string;
};

type AiParseResult = {
  jobInfo: AiJobInfo;
  competencyProposals: AiCompetencyProposal[];
  suggestedRules: AiRuleSuggestion[];
};

const supportedEmploymentTypes = new Set<HrJobFormValues["employmentType"]>([
  "FULL_TIME",
  "PART_TIME",
  "INTERNSHIP",
  "CONTRACT",
]);

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
}

export function JobAiParserModal() {
  const t = useTranslations();
  const { control, setValue } = useFormContext<HrJobFormValues>();
  const values = useWatch({ control });

  const [open, setOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [review, setReview] = useState<AiParseResult | null>(null);
  const [selectedCompetencies, setSelectedCompetencies] = useState<AiCompetencyProposal[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [selectedNewNames, setSelectedNewNames] = useState<string[]>([]);

  const sourceText = [
    values.title && `Vị trí: ${values.title}`,
    values.location && `Địa điểm: ${values.location}`,
    values.description && `Mô tả công việc:\n${values.description.replace(/<[^>]*>/g, " ")}`,
    values.requirementsText?.length && `Yêu cầu ứng viên:\n${values.requirementsText.map((item) => `- ${item}`).join("\n")}`,
    values.benefitsText?.length && `Quyền lợi:\n${values.benefitsText.map((item) => `- ${item}`).join("\n")}`,
  ].filter(Boolean).join("\n\n");

  const handleParse = async () => {
    if (!sourceText.trim()) {
      toast.error("Hãy nhập mô tả, yêu cầu hoặc quyền lợi trước khi nhờ AI hỗ trợ.");
      return;
    }

    setIsParsing(true);
    try {
      const result = await fetchApi<AiParseResult>("/api/v1/hr/jobs/parse", {
        method: "POST",
        body: JSON.stringify({ text: sourceText }),
      });

      setReview(result);
      const proposals = Array.isArray(result.competencyProposals) ? result.competencyProposals : [];
      setSelectedCompetencies(proposals.filter((item) => item.status === "MATCHED" && item.competencyId));
      setSelectedRuleIds((Array.isArray(result.suggestedRules) ? result.suggestedRules : []).map((item) => item.ruleId));
      setSelectedNewNames([]);
    } catch (error: unknown) {
      handleApiError(error, t);
    } finally {
      setIsParsing(false);
    }
  };

  const applyReview = async () => {
    if (!review) return;

    try {
      const { jobInfo } = review;
      if (jobInfo.title) setValue("title", jobInfo.title, { shouldValidate: true, shouldDirty: true });
      if (jobInfo.location && hrWorkLocationOptions.includes(jobInfo.location)) {
        setValue("location", jobInfo.location, { shouldValidate: true, shouldDirty: true });
      }
      if (jobInfo.employmentType && supportedEmploymentTypes.has(jobInfo.employmentType as HrJobFormValues["employmentType"])) {
        setValue("employmentType", jobInfo.employmentType as HrJobFormValues["employmentType"], { shouldValidate: true, shouldDirty: true });
      }
      if (jobInfo.description) setValue("description", jobInfo.description, { shouldValidate: true, shouldDirty: true });
      if (jobInfo.requirements) setValue("requirementsText", toLines(jobInfo.requirements), { shouldValidate: true, shouldDirty: true });
      if (jobInfo.benefits) setValue("benefitsText", toLines(jobInfo.benefits), { shouldValidate: true, shouldDirty: true });
      if (jobInfo.jobFamilyId) setValue("jobFamilyId", jobInfo.jobFamilyId, { shouldValidate: true, shouldDirty: true });
      if (jobInfo.careerLevelId) setValue("careerLevelId", jobInfo.careerLevelId, { shouldValidate: true, shouldDirty: true });

      const matched = selectedCompetencies.map((item) => ({ competencyId: String(item.competencyId), name: item.name, requiredLevel: Number(item.requiredLevel ?? 3), weight: Number(item.weight ?? 10), mandatory: Boolean(item.isMandatory) }));
      const newProposals = review.competencyProposals.filter((item) => item.status === "PROPOSED_NEW" && selectedNewNames.includes(item.name));
      for (const item of newProposals) {
        const created = await fetchApi<{ id: string; name: string }>("/api/v1/hr/competencies", { method: "POST", body: JSON.stringify({ name: item.name, category: item.category ?? "HARD_SKILL", description: item.reason || `Năng lực được HR duyệt từ JD: ${item.name}` }) });
        matched.push({ competencyId: created.id, name: created.name, requiredLevel: Number(item.requiredLevel ?? 3), weight: Number(item.weight ?? 10), mandatory: Boolean(item.isMandatory) });
      }
      if (matched.length) setValue("competencies", matched, { shouldValidate: true, shouldDirty: true });
      if (selectedRuleIds.length) setValue("ruleIds", selectedRuleIds, { shouldValidate: true, shouldDirty: true });

      toast.success("Đã áp dụng các đề xuất được xác nhận vào Job Form.");
      setOpen(false);
    } catch (error: unknown) {
      handleApiError(error, t);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 hover:text-brand">
          <Sparkles className="mr-2 size-4" /> Tạo tự động bằng AI
        </Button>
      </DialogTrigger>
      <DialogContent title="AI kiểm tra và chuẩn hóa nội dung" className="max-w-xl">
        <div className="space-y-4 py-4">
          {!review ? <p className="text-sm leading-6 text-muted">AI sẽ đọc trực tiếp phần mô tả, yêu cầu và quyền lợi bạn đã nhập để chuẩn hóa nội dung. Hãy điền cụ thể trách nhiệm, kinh nghiệm, kỹ năng và quyền lợi để kết quả trích xuất chính xác hơn.</p> : <ReviewSummary result={review} selected={selectedCompetencies} onChange={setSelectedCompetencies} ruleIds={selectedRuleIds} onRulesChange={setSelectedRuleIds} newNames={selectedNewNames} onNewNamesChange={setSelectedNewNames} />}
          <div className="rounded-[9px] border border-border bg-surface-soft p-3 text-xs text-muted">Nguồn dữ liệu hiện có: {sourceText ? `${sourceText.length} ký tự` : "chưa có nội dung"}</div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => { setReview(null); setOpen(false); }}>Hủy</Button>
            {review ? <Button type="button" onClick={applyReview}>Áp dụng đề xuất</Button> : <Button type="button" onClick={handleParse} loading={isParsing}>{isParsing ? <><Loader2 className="mr-2 size-4 animate-spin" /> Đang phân tích...</> : <><Sparkles className="mr-2 size-4" /> Phân tích ngay</>}</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewSummary({ result, selected, onChange, ruleIds, onRulesChange, newNames, onNewNamesChange }: { result: AiParseResult; selected: AiCompetencyProposal[]; onChange: (items: AiCompetencyProposal[]) => void; ruleIds: string[]; onRulesChange: (ids: string[]) => void; newNames: string[]; onNewNamesChange: (names: string[]) => void }) {
  const proposals = result.competencyProposals ?? [];
  const rules = result.suggestedRules ?? [];
  const update = (id: string, key: string, value: unknown) => onChange(selected.map((item) => String(item.competencyId) === id ? { ...item, [key]: value } : item));
  return <div className="space-y-3"><p className="text-sm font-medium text-ink">Xác nhận và chỉnh sửa bản nháp AI</p>{proposals.map((item) => item.status === "PROPOSED_NEW" ? <label key={String(item.name)} className="block rounded border border-warning/40 p-3 text-xs text-muted"><input type="checkbox" checked={newNames.includes(String(item.name))} onChange={(e) => onNewNamesChange(e.target.checked ? [...newNames, String(item.name)] : newNames.filter((name) => name !== String(item.name)))} /> {String(item.name)} — tạo competency dùng chung trong Kho năng lực</label> : <div key={String(item.competencyId)} className="grid grid-cols-[1fr_58px_58px_auto] gap-2 rounded border border-border p-3 text-xs"><label><input type="checkbox" checked={selected.some((x) => String(x.competencyId) === String(item.competencyId))} onChange={(e) => onChange(e.target.checked ? [...selected, item] : selected.filter((x) => String(x.competencyId) !== String(item.competencyId)))} /> {String(item.name)}</label><input type="number" min="1" max="5" value={Number(selected.find((x) => String(x.competencyId) === String(item.competencyId))?.requiredLevel ?? 3)} onChange={(e) => update(String(item.competencyId), "requiredLevel", Number(e.target.value))} /><input type="number" min="1" max="100" value={Number(selected.find((x) => String(x.competencyId) === String(item.competencyId))?.weight ?? 10)} onChange={(e) => update(String(item.competencyId), "weight", Number(e.target.value))} /><label><input type="checkbox" checked={Boolean(selected.find((x) => String(x.competencyId) === String(item.competencyId))?.isMandatory)} onChange={(e) => update(String(item.competencyId), "isMandatory", e.target.checked)} /> Bắt buộc</label></div>)}<div className="rounded border border-border p-3 text-xs text-muted"><p className="mb-2 font-medium text-ink">Rule gợi ý</p>{rules.map((rule) => <label key={String(rule.ruleId)} className="mr-3 inline-flex items-center gap-1"><input type="checkbox" checked={ruleIds.includes(String(rule.ruleId))} onChange={(e) => onRulesChange(e.target.checked ? [...ruleIds, String(rule.ruleId)] : ruleIds.filter((id) => id !== String(rule.ruleId)))} /> {String(rule.reason || rule.ruleId)}</label>)}</div></div>;
}
