"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Check } from "lucide-react";
import type { HrJobFormValues } from "../jobs.schema";
import { useRules } from "@/features/hr/knowledge-base/knowledge-base.queries";

export function RuleSelector() {
  const { data: rules, isLoading } = useRules();
  const { control, setValue } = useFormContext<HrJobFormValues>();
  const selectedRuleIds = useWatch({ control, name: "ruleIds" }) || [];

  if (isLoading) {
    return <div className="text-sm text-muted">Đang tải danh sách luật...</div>;
  }

  if (!rules || rules.length === 0) {
    return <div className="text-sm text-muted">Chưa có luật thưởng điểm nào được định nghĩa.</div>;
  }

  const toggleRule = (id: string) => {
    if (selectedRuleIds.includes(id)) {
      setValue("ruleIds", selectedRuleIds.filter((r) => r !== id), { shouldDirty: true });
    } else {
      setValue("ruleIds", [...selectedRuleIds, id], { shouldDirty: true });
    }
  };

  return (
    <div className="mt-4">
      <label className="mb-3 block text-sm font-semibold text-ink">Luật thưởng điểm (Tùy chọn)</label>
      <div className="grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => {
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
    </div>
  );
}
