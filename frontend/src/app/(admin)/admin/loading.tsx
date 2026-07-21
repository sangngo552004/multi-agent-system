import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-7" aria-label="Đang tải trang quản trị">
      <div className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-[min(100%,480px)]" /></div>
      <Skeleton className="h-[520px] w-full" />
    </div>
  );
}
