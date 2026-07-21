import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Đang tải tổng quan">
      <div className="grid overflow-hidden rounded-[12px] border border-border bg-surface sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => <div key={index} className="min-h-36 border-b border-r border-border p-5"><Skeleton className="h-3 w-24" /><Skeleton className="mt-5 h-9 w-16" /><Skeleton className="mt-4 h-3 w-20" /></div>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-[330px]" /><Skeleton className="h-[330px]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Skeleton className="h-[350px]" /><Skeleton className="h-[350px]" />
      </div>
    </div>
  );
}
