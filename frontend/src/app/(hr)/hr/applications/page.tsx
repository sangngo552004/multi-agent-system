import type { Metadata } from "next";
import { HrApplicationsPage } from "@/features/hr/applications/components/applications-page";

export const metadata: Metadata = { title: "Hồ sơ ứng viên" };

export default function HrApplicationsRoute() { return <HrApplicationsPage />; }
