import { Skeleton } from "@/components/ui/skeleton";

export function HrDashboardSkeleton() {
  return <div className="space-y-6" aria-label="Đang tải tổng quan tuyển dụng"><div className="grid gap-px overflow-hidden rounded-[12px] border border-border bg-border sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-none" />)}</div><div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"><Skeleton className="h-[350px]" /><Skeleton className="h-[350px]" /></div><div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]"><Skeleton className="h-[340px]" /><Skeleton className="h-[340px]" /></div></div>;
}
