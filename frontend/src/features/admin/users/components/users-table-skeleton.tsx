import { Skeleton } from "@/components/ui/skeleton";

export function UsersTableSkeleton() {
  return (
    <div className="divide-y divide-border" aria-label="Đang tải người dùng">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="grid min-w-[800px] grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-5 px-5 py-4">
          <div className="flex items-center gap-3"><Skeleton className="size-9" /><span className="space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-44" /></span></div>
          <Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-24" /><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
