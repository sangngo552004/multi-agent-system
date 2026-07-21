import { Skeleton } from "@/components/ui/skeleton";

export function JobsTableSkeleton() {
  return (
    <div className="divide-y divide-border" aria-label="Đang tải tin tuyển dụng">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="grid min-w-[980px] grid-cols-[1.7fr_1fr_1.2fr_0.6fr_1fr_0.8fr] items-center gap-5 px-5 py-4">
          <span className="space-y-2"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3 w-32" /></span>
          <Skeleton className="h-3 w-24" /><span className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-16" /></span>
          <Skeleton className="h-4 w-8" /><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
