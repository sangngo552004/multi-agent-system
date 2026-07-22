import type { Metadata } from "next";
import { HrJobsPage } from "@/features/hr/jobs/components/jobs-page";

export const metadata: Metadata = { title: "Tin tuyển dụng" };

export default function HrJobsRoute() {
  return <HrJobsPage />;
}
