import { Skeleton } from "@/components/ui/skeleton";

export function ApplicationsTableSkeleton() {
  return <div className="divide-y divide-border">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="grid min-w-[900px] grid-cols-[1.3fr_1.5fr_1fr_1fr_1fr_0.8fr] items-center gap-5 px-5 py-4"><span className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-3.5 w-32" /></span><span className="space-y-2"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3 w-24" /></span><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-24" /><Skeleton className="h-3 w-24" /></div>)}</div>;
}
