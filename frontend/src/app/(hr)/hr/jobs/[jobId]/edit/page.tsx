import type { Metadata } from "next";
import { HrEditJobFormPage } from "@/features/hr/jobs/components/job-form-page";

export const metadata: Metadata = { title: "Chỉnh sửa tin tuyển dụng" };

export default async function HrEditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <HrEditJobFormPage jobId={jobId} />;
}
