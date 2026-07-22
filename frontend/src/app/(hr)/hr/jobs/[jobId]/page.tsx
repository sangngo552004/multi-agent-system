import type { Metadata } from "next";
import { HrJobDetailPage } from "@/features/hr/jobs/components/job-detail-page";

export const metadata: Metadata = { title: "Chi tiết tin tuyển dụng" };

export default async function HrJobDetailRoute({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <HrJobDetailPage jobId={jobId} />;
}
