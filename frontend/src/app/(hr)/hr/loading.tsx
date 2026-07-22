import { Skeleton } from "@/components/ui/skeleton";

export default function HrLoading() {
  return <div className="space-y-6"><Skeleton className="h-24" /><Skeleton className="h-40" /><Skeleton className="h-80" /></div>;
}
