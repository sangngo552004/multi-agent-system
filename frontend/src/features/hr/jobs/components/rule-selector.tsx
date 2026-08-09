"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Check, Info, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { HrJobFormValues } from "../jobs.schema";
import { useRules } from "@/features/hr/knowledge-base/knowledge-base.queries";
import { RuleFormModal } from "@/features/hr/knowledge-base/components/rule-form-modal";
import type { InstitutionalRule } from "@/features/hr/knowledge-base/knowledge-base.types";

export function RuleSelector() {
  const { data: rules, isLoading } = useRules();
  const { control, setValue } = useFormContext<HrJobFormValues>();
  const selectedRuleIds = useWatch({ control, name: "ruleIds" }) || [];
  const jobFamilyId = useWatch({ control, name: "jobFamilyId" });
  const [editingRule, setEditingRule] = useState<InstitutionalRule | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);

  if (isLoading) {
    return <div className="text-sm text-muted">Đang tải danh sách luật...</div>;
  }

  const suggestedRules = (rules ?? []).filter((rule) => !jobFamilyId || !rule.jobFamilies?.length || rule.jobFamilies.some((family) => family.id === jobFamilyId));

  const toggleRule = (id: string) => {
    if (selectedRuleIds.includes(id)) {
      setValue("ruleIds", selectedRuleIds.filter((r) => r !== id), { shouldDirty: true });
    } else {
      setValue("ruleIds", [...selectedRuleIds, id], { shouldDirty: true });
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between gap-3"><div><label className="block text-sm font-semibold text-ink">Luật thưởng điểm (Tùy chọn)</label><p className="mt-1 flex items-center gap-1 text-xs text-muted"><Info className="size-3" />Chỉ cộng thêm sau khi AI chấm năng lực bắt buộc.</p></div><button type="button" onClick={() => { setEditingRule(null); setRuleDialogOpen(true); }} className="inline-flex items-center gap-1 text-sm font-semibold text-brand"><Plus className="size-4" /> Tạo Rule</button></div>
      {!suggestedRules.length ? <div className="rounded-[8px] border border-dashed border-border p-4 text-sm text-muted">Chưa có Rule phù hợp. Bạn có thể tạo Rule mới ngay tại đây.</div> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {suggestedRules.map((rule) => {
          const isSelected = selectedRuleIds.includes(rule.id);
          return (
            <div
              key={rule.id}
              onClick={() => toggleRule(rule.id)}
              className={`relative cursor-pointer rounded-[8px] border p-3 transition-colors ${
                isSelected ? "border-brand bg-brand/5" : "border-border bg-surface hover:border-brand/40 hover:bg-surface-hover"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm font-medium ${isSelected ? "text-brand" : "text-ink"}`}>
                    {rule.name} <span className="ml-1 rounded bg-success/10 px-1.5 py-0.5 text-xs font-semibold text-success">+{rule.bonusPoints}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted line-clamp-2">{rule.description}</p>
                </div>
                <button type="button" aria-label={`Chỉnh sửa ${rule.name}`} onClick={(event) => { event.stopPropagation(); setEditingRule(rule); setRuleDialogOpen(true); }} className="rounded p-1 text-muted hover:bg-surface-soft hover:text-brand"><Pencil className="size-3.5" /></button>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <RuleFormModal isOpen={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} initialData={editingRule} onSaved={(rule) => { if (!selectedRuleIds.includes(rule.id)) setValue("ruleIds", [...selectedRuleIds, rule.id], { shouldDirty: true }); setRuleDialogOpen(false); }} />
    </div>
  );
}
