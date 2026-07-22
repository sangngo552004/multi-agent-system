import { Skeleton } from "@/components/ui/skeleton";

export function HrJobDetailSkeleton() {
  return <div className="space-y-7"><Skeleton className="h-5 w-36" /><div><Skeleton className="h-3 w-28" /><Skeleton className="mt-3 h-10 w-80 max-w-full" /><Skeleton className="mt-4 h-4 w-52" /></div><div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.72fr)]"><div className="space-y-6"><Skeleton className="h-[440px]" /><Skeleton className="h-[360px]" /></div><div className="space-y-4"><Skeleton className="h-56" /><Skeleton className="h-52" /><Skeleton className="h-72" /></div></div></div>;
}
