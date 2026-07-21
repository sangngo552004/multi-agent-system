"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_ADMIN_ID } from "@/lib/constants";
import { useUpdateUserStatus } from "@/features/admin/users/users.queries";
import {
  userStatusReasonSchema,
  type UserStatusReasonForm,
} from "@/features/admin/users/users.schema";
import type { AdminUser } from "@/types/domain/admin";

export function UserStatusDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const mutation = useUpdateUserStatus();
  const willBlock = user.status === "ACTIVE";
  const selfBlock = user.id === CURRENT_ADMIN_ID && willBlock;
  const form = useForm<UserStatusReasonForm>({
    resolver: zodResolver(userStatusReasonSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = form.handleSubmit(async ({ reason }) => {
    try {
      await mutation.mutateAsync({
        userId: user.id,
        status: willBlock ? "BLOCKED" : "ACTIVE",
        reason,
      });
      toast.success(willBlock ? "Đã khóa tài khoản" : "Đã mở lại tài khoản", {
        description: user.fullName,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error("Không thể cập nhật tài khoản", {
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
      });
    }
  });

  return (
    <>
      <Button
        variant={willBlock ? "danger" : "secondary"}
        className="w-full"
        disabled={selfBlock}
        onClick={() => setOpen(true)}
      >
        {willBlock ? <LockKeyhole className="size-4" /> : <LockKeyholeOpen className="size-4" />}
        {willBlock ? "Khóa tài khoản" : "Mở lại tài khoản"}
      </Button>
      {selfBlock ? <p className="mt-2 text-xs leading-5 text-warning">Tài khoản admin đang đăng nhập không thể tự khóa.</p> : null}

      <Dialog open={open} onOpenChange={(nextOpen) => !mutation.isPending && setOpen(nextOpen)}>
        <DialogContent
          title={willBlock ? "Khóa tài khoản?" : "Mở lại tài khoản?"}
          description={willBlock ? `Sau khi khóa, ${user.fullName} không thể đăng nhập hoặc tiếp tục sử dụng nền tảng.` : `${user.fullName} sẽ có thể đăng nhập và sử dụng lại các chức năng theo vai trò.`}
        >
          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="status-reason" className="mb-2 block text-xs font-semibold text-ink">Lý do thực hiện</label>
              <Textarea id="status-reason" placeholder={willBlock ? "Ví dụ: Tài khoản có hoạt động không phù hợp..." : "Ví dụ: Đã kiểm tra và khắc phục vấn đề..."} {...form.register("reason")} />
              {form.formState.errors.reason ? <p className="mt-1.5 text-xs text-danger">{form.formState.errors.reason.message}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>Hủy</Button>
              <Button type="submit" variant={willBlock ? "danger" : "primary"} loading={mutation.isPending}>{willBlock ? "Xác nhận khóa" : "Xác nhận mở"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
