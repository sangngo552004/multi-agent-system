import { Skeleton } from "@/components/ui/skeleton";

export function TalentPoolSkeleton() { return <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-[390px] rounded-[12px]" />)}</div>; }
