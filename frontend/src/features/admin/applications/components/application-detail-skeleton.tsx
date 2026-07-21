import { Skeleton } from "@/components/ui/skeleton";

export function ApplicationDetailSkeleton() { return <div className="space-y-7"><Skeleton className="h-5 w-36" /><div className="space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-9 w-72" /><Skeleton className="h-4 w-96 max-w-full" /></div><Skeleton className="h-56" /><Skeleton className="h-[480px]" /></div>; }
