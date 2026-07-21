import type { Metadata } from "next";
import { ApplicationDetailPage } from "@/features/admin/applications/components/application-detail-page";

export const metadata: Metadata = { title: "Chi tiết hồ sơ ứng tuyển" };

export default async function AdminApplicationDetailRoute({ params }: { params: Promise<{ applicationId: string }> }) { const { applicationId } = await params; return <ApplicationDetailPage applicationId={applicationId} />; }
