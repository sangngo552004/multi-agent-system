import { Skeleton } from "@/components/ui/skeleton";

export function HrApplicationsSkeleton() {
  return <div className="space-y-0">{Array.from({ length: 6 }, (_, index) => <div key={index} className="grid grid-cols-5 gap-5 border-b border-border px-5 py-5 last:border-0"><Skeleton className="h-9" /><Skeleton className="h-9" /><Skeleton className="h-7" /><Skeleton className="h-7" /><Skeleton className="h-9" /></div>)}</div>;
}
