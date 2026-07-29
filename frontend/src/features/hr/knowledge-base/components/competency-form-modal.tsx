"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: Competency | null;
}) {
  const saveMutation = useSaveCompetency();

  const form = useForm<CompetencyFormValues>({
    resolver: zodResolver(competencySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description,
          category: initialData.category,
        });
      } else {
        form.reset({ name: "", description: "", category: "" });
      }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await saveMutation.mutateAsync({ id: initialData?.id, data: values });
      toast.success(initialData ? "Cập nhật thành công" : "Thêm mới thành công");
      onClose();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Đã có lỗi xảy ra");
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Chỉnh sửa Kỹ năng" : "Thêm Kỹ năng mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Danh mục</label>
            <Input {...form.register("category")} placeholder="Ví dụ: Backend, Soft Skill..." />
            {form.formState.errors.category && <p className="mt-1 text-xs text-danger">{form.formState.errors.category.message}</p>}
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
