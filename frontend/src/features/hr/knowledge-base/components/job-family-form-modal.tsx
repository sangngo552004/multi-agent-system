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
import { jobFamilySchema, type JobFamilyFormValues } from "../knowledge-base.schema";
import { useSaveJobFamily } from "../knowledge-base.queries";
import type { JobFamily } from "../knowledge-base.types";

export function JobFamilyFormModal({
  isOpen,
  onClose,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: JobFamily | null;
}) {
  const saveMutation = useSaveJobFamily();

  const form = useForm<JobFamilyFormValues>({
    resolver: zodResolver(jobFamilySchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({ name: initialData.name, description: initialData.description });
      } else {
        form.reset({ name: "", description: "" });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Chỉnh sửa Nhóm nghề" : "Thêm Nhóm nghề mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tên nhóm nghề</label>
            <Input {...form.register("name")} placeholder="Nhập tên nhóm nghề" />
            {form.formState.errors.name && <p className="mt-1 text-xs text-danger">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mô tả chi tiết</label>
            <Textarea {...form.register("description")} placeholder="Mô tả nhóm nghề..." rows={4} />
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
