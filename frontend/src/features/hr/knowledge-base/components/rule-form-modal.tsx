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

import { institutionalRuleSchema, type InstitutionalRuleFormValues } from "../knowledge-base.schema";
import { useSaveRule } from "../knowledge-base.queries";
import type { InstitutionalRule } from "../knowledge-base.types";

export function RuleFormModal({
  isOpen,
  onClose,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: InstitutionalRule | null;
}) {
  const saveMutation = useSaveRule();

  const form = useForm<InstitutionalRuleFormValues>({
    resolver: zodResolver(institutionalRuleSchema),
    defaultValues: {
      ruleCode: "",
      name: "",
      description: "",
      bonusPoints: 0,
      maxImpactPercent: 20,
      appliesToDomain: "ALL",
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
        });
      } else {
        form.reset({ ruleCode: "", name: "", description: "", bonusPoints: 0, maxImpactPercent: 20, appliesToDomain: "ALL" });
      }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await saveMutation.mutateAsync({ id: initialData?.id, data: values });
      toast.success(initialData ? "Cập nhật thành công" : "Thêm mới thành công");
      onClose();
    } catch (error: unknown) {
      handleApiError(error, t);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Chỉnh sửa Luật thưởng điểm" : "Thêm Luật thưởng điểm"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Mã Luật (Rule Code)</label>
              <Input {...form.register("ruleCode")} placeholder="VD: TIER_1_SCHOOL" disabled={!!initialData} />
              {form.formState.errors.ruleCode && <p className="mt-1 text-xs text-danger">{form.formState.errors.ruleCode.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Lĩnh vực áp dụng</label>
              <Input {...form.register("appliesToDomain")} placeholder="VD: ALL, IT, HR..." />
              {form.formState.errors.appliesToDomain && <p className="mt-1 text-xs text-danger">{form.formState.errors.appliesToDomain.message}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tên hiển thị</label>
            <Input {...form.register("name")} placeholder="Nhập tên quy tắc" />
            {form.formState.errors.name && <p className="mt-1 text-xs text-danger">{form.formState.errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mô tả chi tiết</label>
            <Textarea {...form.register("description")} placeholder="Mô tả khi nào thì áp dụng luật này..." rows={3} />
            {form.formState.errors.description && <p className="mt-1 text-xs text-danger">{form.formState.errors.description.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
            <Button type="submit" loading={saveMutation.isPending}>Lưu lại</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
