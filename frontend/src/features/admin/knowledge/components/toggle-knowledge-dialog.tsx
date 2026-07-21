"use client";

import { Power } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToggleKnowledge } from "@/features/admin/knowledge/knowledge.queries";
import type { KnowledgeEntity } from "@/features/admin/knowledge/knowledge.types";
import type { KnowledgeItemStatus } from "@/types/domain/admin";

export function ToggleKnowledgeDialog({ entity, id, name, status, usageCount }: { entity: KnowledgeEntity; id: string; name: string; status: KnowledgeItemStatus; usageCount: number }) {
  const [open, setOpen] = useState(false);
  const mutation = useToggleKnowledge();
  const nextStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  const submit = async () => { try { await mutation.mutateAsync({ entity, id, status: nextStatus, force: true }); toast.success(nextStatus === "ACTIVE" ? "Đã bật sử dụng" : "Đã ngừng sử dụng", { description: name }); setOpen(false); } catch (error) { toast.error("Không thể cập nhật", { description: error instanceof Error ? error.message : "Vui lòng thử lại." }); } };
  return <><Button size="sm" variant="ghost" className={nextStatus === "INACTIVE" ? "text-danger hover:text-danger" : "text-success hover:text-success"} onClick={() => setOpen(true)}><Power className="size-3.5" />{nextStatus === "ACTIVE" ? "Bật lại" : "Tắt"}</Button><Dialog open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}><DialogContent title={nextStatus === "ACTIVE" ? "Bật sử dụng lại?" : "Ngừng sử dụng mục này?"} description={usageCount > 0 && nextStatus === "INACTIVE" ? `Mục này đang được dùng bởi ${usageCount} tin tuyển dụng. Dữ liệu cũ vẫn được giữ nhưng không thể chọn cho tin mới.` : "Thay đổi sẽ áp dụng ngay cho dữ liệu demo."}><div className="mt-6 flex justify-end gap-2 border-t border-border pt-4"><Button variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>Hủy</Button><Button variant={nextStatus === "INACTIVE" ? "danger" : "primary"} onClick={submit} loading={mutation.isPending}>Xác nhận</Button></div></DialogContent></Dialog></>;
}
