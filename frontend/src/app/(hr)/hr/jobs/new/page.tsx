import type { Metadata } from "next";
import { HrNewJobFormPage } from "@/features/hr/jobs/components/job-form-page";

export const metadata: Metadata = { title: "Tạo tin tuyển dụng" };

export default function HrNewJobPage() {
  return <HrNewJobFormPage />;
}
