import type { Metadata } from "next";
import { Suspense } from "react";
import { JobsPage } from "@/features/admin/jobs/components/jobs-page";
import { JobsTableSkeleton } from "@/features/admin/jobs/components/jobs-table-skeleton";

export const metadata: Metadata = { title: "Tin tuyển dụng" };

export default function AdminJobsPage() {
  return (
    <Suspense fallback={<div className="overflow-hidden rounded-[12px] border border-border bg-surface"><JobsTableSkeleton /></div>}>
      <JobsPage />
    </Suspense>
  );
}
