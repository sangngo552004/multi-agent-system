import type { Metadata } from "next";
import { JobDetailPage } from "@/features/admin/jobs/components/job-detail-page";

export const metadata: Metadata = { title: "Chi tiết tin tuyển dụng" };

export default async function AdminJobDetailRoute({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <JobDetailPage jobId={jobId} />;
}
