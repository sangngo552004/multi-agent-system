import { Skeleton } from "@/components/ui/skeleton";

export function UserDetailSkeleton() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-center gap-4"><Skeleton className="size-16" /><div className="space-y-2"><Skeleton className="h-7 w-52" /><Skeleton className="h-4 w-64" /></div></div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><Skeleton className="h-[440px]" /><Skeleton className="h-[330px]" /></div>
    </div>
  );
}
