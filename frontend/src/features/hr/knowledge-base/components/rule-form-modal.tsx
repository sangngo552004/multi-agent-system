"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useJobFamilies, usePedigreeGroups } from "../knowledge-base.queries";

import { institutionalRuleSchema, type InstitutionalRuleFormValues } from "../knowledge-base.schema";
import { useSaveRule } from "../knowledge-base.queries";
import type { InstitutionalRule } from "../knowledge-base.types";

export function RuleFormModal({
  isOpen,
  onClose,
  initialData,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: InstitutionalRule | null;
  onSaved?: (rule: InstitutionalRule) => void;
}) {
  const t = useTranslations();
  const saveMutation = useSaveRule();
  const { data: groups = [] } = usePedigreeGroups();
  const { data: jobFamilies = [] } = useJobFamilies();

  const form = useForm<InstitutionalRuleFormValues>({
    resolver: zodResolver(institutionalRuleSchema),
    defaultValues: {
      ruleCode: "",
      name: "",
      description: "",
      bonusPoints: 0,
      maxImpactPercent: 20,
      appliesToDomain: "ALL",
      pedigreeGroupId: "",
      jobFamilyIds: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          ruleCode: initialData.ruleCode,
          name: initialData.name,
          description: initialData.description,
          bonusPoints: initialData.bonusPoints,
          maxImpactPercent: initialData.maxImpactPercent,
          appliesToDomain: initialData.appliesToDomain,
          pedigreeGroupId: initialData.pedigreeGroup?.id ?? "",
          jobFamilyIds: initialData.jobFamilies?.map((item) => item.id) ?? [],
        });
      } else {
        form.reset({ ruleCode: "", name: "", description: "", bonusPoints: 0, maxImpactPercent: 20, appliesToDomain: "ALL", pedigreeGroupId: "", jobFamilyIds: [] });
      }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const generatedCode = `RULE_${values.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
      const saved = await saveMutation.mutateAsync({ id: initialData?.id, data: { ...values, ruleCode: values.ruleCode || generatedCode } });
      onSaved?.(saved);
      toast.success(initialData ? "Cập nhật thành công" : "Thêm mới thành công");
      onClose();
    } catch (error: unknown) {
      handleApiError(error, t);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent title={initialData ? "Chỉnh sửa quy tắc đối sánh" : "Tạo quy tắc đối sánh"} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Chỉnh sửa quy tắc đối sánh" : "Tạo quy tắc đối sánh"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <section className="rounded-xl border border-border bg-surface-soft p-4"><h3 className="font-medium text-ink">1. Điều kiện kích hoạt</h3><p className="mb-3 mt-1 text-xs text-muted">CV phải có đúng loại bằng chứng của nhóm tổ chức này thì quy tắc mới áp dụng.</p><label className="mb-1 block text-sm font-medium text-ink">Nhóm tổ chức đối chiếu</label><select className="h-10 w-full rounded-[9px] border border-border-strong bg-surface px-3 text-sm" {...form.register("pedigreeGroupId")}><option value="">Chọn nhóm tổ chức…</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} · {group.evidenceSource}</option>)}</select>{form.formState.errors.pedigreeGroupId && <p className="mt-1 text-xs text-danger">{form.formState.errors.pedigreeGroupId.message}</p>}</section>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tên hiển thị</label>
            <Input {...form.register("name")} placeholder="Nhập tên quy tắc" />
            {form.formState.errors.name && <p className="mt-1 text-xs text-danger">{form.formState.errors.name.message}</p>}
          </div>
          <section className="rounded-xl border border-border bg-surface-soft p-4"><h3 className="font-medium text-ink">2. Điểm tác động</h3><p className="mb-3 mt-1 text-xs text-muted">Giới hạn giữ cho điểm ưu tiên không lấn át kết quả đối chiếu năng lực.</p><div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Điểm cộng (+)</label>
              <Input type="number" step="0.5" {...form.register("bonusPoints", { valueAsNumber: true })} />
              {form.formState.errors.bonusPoints && <p className="mt-1 text-xs text-danger">{form.formState.errors.bonusPoints.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Giới hạn ảnh hưởng (%)</label>
              <Input type="number" step="1" {...form.register("maxImpactPercent", { valueAsNumber: true })} />
              {form.formState.errors.maxImpactPercent && <p className="mt-1 text-xs text-danger">{form.formState.errors.maxImpactPercent.message}</p>}
            </div>
          </div></section>
          <section className="rounded-xl border border-border bg-surface-soft p-4"><h3 className="font-medium text-ink">3. Phạm vi gợi ý <span className="font-normal text-muted">(tuỳ chọn)</span></h3><p className="mb-3 mt-1 text-xs text-muted">Chỉ để gợi ý tại lúc tạo Job; quy tắc chỉ chạy khi HR chọn nó cho Job.</p><div className="flex flex-wrap gap-3">{jobFamilies.map((family) => <label key={family.id} className="flex items-center gap-1.5 text-sm text-muted"><input type="checkbox" value={family.id} {...form.register("jobFamilyIds")} />{family.name}</label>)}</div></section>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Ghi chú cho HR</label>
            <Textarea {...form.register("description")} placeholder="Ví dụ: Chỉ dùng như một tín hiệu bổ sung, không thay thế đánh giá kỹ năng." rows={3} />
            {form.formState.errors.description && <p className="mt-1 text-xs text-danger">{form.formState.errors.description.message}</p>}
          </div>
          <Input type="hidden" {...form.register("ruleCode")} />
          <Input type="hidden" {...form.register("appliesToDomain")} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
            <Button type="submit" loading={saveMutation.isPending}>Lưu lại</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
