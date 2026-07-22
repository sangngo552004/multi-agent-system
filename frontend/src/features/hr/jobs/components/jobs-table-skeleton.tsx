import { Skeleton } from "@/components/ui/skeleton";

export function HrJobsTableSkeleton() {
  return <div aria-label="Đang tải danh sách tin"><div className="grid grid-cols-6 gap-4 border-b border-border bg-surface-soft/55 px-5 py-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-3" />)}</div>{Array.from({ length: 6 }).map((_, index) => <div key={index} className="grid grid-cols-6 gap-4 border-b border-border/80 px-5 py-4 last:border-0"><div><Skeleton className="h-4 w-36" /><Skeleton className="mt-2 h-3 w-24" /></div>{Array.from({ length: 5 }).map((__, cell) => <Skeleton key={cell} className="h-4" />)}</div>)}</div>;
}
