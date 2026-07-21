import { Skeleton } from "@/components/ui/skeleton";

export function JobDetailSkeleton() {
  return (
    <div className="space-y-7" aria-label="Đang tải tin tuyển dụng">
      <Skeleton className="h-5 w-36" />
      <div className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-9 w-80 max-w-full" /><Skeleton className="h-4 w-64" /></div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.72fr)]"><div className="space-y-6"><Skeleton className="h-[560px]" /><Skeleton className="h-[360px]" /></div><Skeleton className="h-[520px]" /></div>
    </div>
  );
}
