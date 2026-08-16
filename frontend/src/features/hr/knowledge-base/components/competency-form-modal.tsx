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
import { competencySchema, type CompetencyFormValues } from "../knowledge-base.schema";
import { useSaveCompetency } from "../knowledge-base.queries";
import type { Competency } from "../knowledge-base.types";

export function CompetencyFormModal({
  isOpen,
  onClose,
  initialData,
  onConfigureLevels,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: Competency | null;
  onConfigureLevels?: (competency: Competency, level: number) => void;
}) {
  const t = useTranslations();
  const saveMutation = useSaveCompetency();

  const form = useForm<CompetencyFormValues>({
    resolver: zodResolver(competencySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "HARD_SKILL",
      initialLevel: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description,
          category: initialData.category as CompetencyFormValues["category"],
          initialLevel: undefined,
        });
      } else {
        form.reset({ name: "", description: "", category: "HARD_SKILL", initialLevel: undefined });
      }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await saveMutation.mutateAsync({ id: initialData?.id, data: values });
      toast.success(initialData ? "Cập nhật thành công" : "Thêm mới thành công");
      onClose();
      if (values.initialLevel && !initialData) {
        onConfigureLevels?.(saved, values.initialLevel);
      }
    } catch (error: unknown) {
      handleApiError(error, t);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent title={initialData ? "Chỉnh sửa Kỹ năng" : "Thêm Kỹ năng mới"}>
        <DialogHeader>
          <DialogTitle>{initialData ? "Chỉnh sửa Kỹ năng" : "Thêm Kỹ năng mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Danh mục</label>
            <select className="h-10 w-full rounded-[9px] border border-border-strong bg-surface px-3 text-sm" {...form.register("category")}>
              <option value="HARD_SKILL">Kỹ năng chuyên môn</option>
              <option value="SOFT_SKILL">Kỹ năng mềm</option>
              <option value="EXPERIENCE">Kinh nghiệm</option>
              <option value="PEDIGREE">Hồ sơ tổ chức / học vấn</option>
            </select>
            {form.formState.errors.category && <p className="mt-1 text-xs text-danger">{form.formState.errors.category.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Level cần cấu hình <span className="font-normal text-muted">(tuỳ chọn)</span></label>
            <select className="h-10 w-full rounded-[9px] border border-border-strong bg-surface px-3 text-sm" {...form.register("initialLevel", { setValueAs: (value) => value === "" ? undefined : Number(value) })}>
              <option value="">Chưa chọn — thiết lập sau</option>
              <option value="1">Cấp 1 · Cơ bản</option>
              <option value="2">Cấp 2 · Thực hành</option>
              <option value="3">Cấp 3 · Độc lập</option>
              <option value="4">Cấp 4 · Thành thạo</option>
              <option value="5">Cấp 5 · Chuyên gia</option>
            </select>
            <p className="mt-1 text-xs text-muted">Hệ thống khởi tạo đủ 5 cấp; sau khi lưu, dùng biểu tượng cây ở danh sách để bổ sung mô tả đối chiếu cho từng cấp.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tên kỹ năng</label>
            <Input {...form.register("name")} placeholder="Nhập tên kỹ năng" />
            {form.formState.errors.name && <p className="mt-1 text-xs text-danger">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mô tả chi tiết</label>
            <Textarea {...form.register("description")} placeholder="Mô tả kỹ năng này dùng để làm gì..." rows={4} />
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
