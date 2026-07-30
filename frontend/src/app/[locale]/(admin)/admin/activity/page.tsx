import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivityPage } from "@/features/admin/activity/components/activity-page";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Nhật ký hoạt động" };

export default function AdminActivityPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[620px] rounded-[12px]" />}>
      <ActivityPage />
    </Suspense>
  );
}
