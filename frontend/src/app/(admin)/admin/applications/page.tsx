import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationsPage } from "@/features/admin/applications/components/applications-page";
import { ApplicationsTableSkeleton } from "@/features/admin/applications/components/applications-table-skeleton";

export const metadata: Metadata = { title: "Hồ sơ ứng tuyển và AI" };

export default function AdminApplicationsPage() { return <Suspense fallback={<div className="overflow-hidden rounded-[12px] border border-border bg-surface"><ApplicationsTableSkeleton /></div>}><ApplicationsPage /></Suspense>; }
