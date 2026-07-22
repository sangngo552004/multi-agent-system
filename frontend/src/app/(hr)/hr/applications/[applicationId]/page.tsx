import type { Metadata } from "next";
import { HrApplicationDetailPage } from "@/features/hr/applications/components/application-detail-page";

export const metadata: Metadata = { title: "Chi tiết hồ sơ ứng viên" };

export default async function HrApplicationDetailRoute({ params }: { params: Promise<{ applicationId: string }> }) { const { applicationId } = await params; return <HrApplicationDetailPage applicationId={applicationId} />; }
