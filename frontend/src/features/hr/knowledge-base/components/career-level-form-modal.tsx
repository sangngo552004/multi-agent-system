"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { careerLevelSchema, type CareerLevelFormValues } from "../knowledge-base.schema";
import { useSaveCareerLevel } from "../knowledge-base.queries";
import type { CareerLevel } from "../knowledge-base.types";

export function CareerLevelFormModal({
  isOpen,
  onClose,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: CareerLevel | null;
}) {
  const saveMutation = useSaveCareerLevel();

  const form = useForm<CareerLevelFormValues>({
    resolver: zodResolver(careerLevelSchema),
    defaultValues: { name: "", description: "", rankValue: 1 },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({ name: initialData.name, description: initialData.description, rankValue: initialData.rankValue });
      } else {
        form.reset({ name: "", description: "", rankValue: 1 });
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
          <DialogTitle>{initialData ? "Chỉnh sửa Cấp bậc" : "Thêm Cấp bậc mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink">Tên cấp bậc</label>
              <Input {...form.register("name")} placeholder="VD: Senior, Junior..." />
              {form.formState.errors.name && <p className="mt-1 text-xs text-danger">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Thứ bậc (Rank)</label>
              <Input type="number" {...form.register("rankValue", { valueAsNumber: true })} min={1} />
              {form.formState.errors.rankValue && <p className="mt-1 text-xs text-danger">{form.formState.errors.rankValue.message}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mô tả chi tiết</label>
            <Textarea {...form.register("description")} placeholder="Mô tả cấp bậc..." rows={4} />
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
