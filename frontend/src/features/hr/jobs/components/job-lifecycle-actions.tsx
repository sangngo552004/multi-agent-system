"use client";

import { Copy, Edit3, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { handleApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { useChangeHrJobStatus, useDuplicateHrJob } from "@/features/hr/jobs/jobs.queries";
import type { HrJobDetail } from "@/features/hr/jobs/jobs.types";

export function HrJobLifecycleActions({ job }: { job: HrJobDetail }) {
  const router = useRouter();
  const t = useTranslations();
  const changeStatus = useChangeHrJobStatus();
  const duplicate = useDuplicateHrJob();

  const change = async (status: "PUBLISHED" | "CLOSED") => {
    try {
      await changeStatus.mutateAsync({ jobId: job.id, status });
      toast.success(status === "PUBLISHED" ? "Tin đã được mở tuyển" : "Tin đã được đóng");
    } catch (error) { handleApiError(error, t); }
  };
  const duplicateJob = async () => {
    try {
      const copy = await duplicate.mutateAsync(job.id);
      router.push(`/hr/jobs/${copy.id}/edit`);
    } catch (error) { handleApiError(error, t); }
  };

  return <div className="flex flex-wrap items-center justify-end gap-2">
    {job.status !== "CLOSED" ? <Button asChild variant="secondary" size="sm"><Link href={`/hr/jobs/${job.id}/edit`}><Edit3 className="size-4" /> Chỉnh sửa</Link></Button> : null}
    {job.status === "DRAFT" ? <Button size="sm" loading={changeStatus.isPending} onClick={() => change("PUBLISHED")}>Mở tuyển</Button> : null}
    {job.status === "PUBLISHED" ? <Button variant="ghost" size="sm" loading={changeStatus.isPending} onClick={() => change("CLOSED")}><Square className="size-4" /> Đóng tin</Button> : null}
    {job.status === "CLOSED" ? <Button size="sm" onClick={duplicateJob} loading={duplicate.isPending}><Copy className="size-4" /> Nhân bản thành bản nháp</Button> : null}
  </div>;
}
