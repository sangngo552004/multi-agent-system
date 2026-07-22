"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-display/data-table";
import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { HrJobStatusTabs } from "@/features/hr/jobs/components/job-status-tabs";
import { hrJobTableColumns } from "@/features/hr/jobs/components/job-table-columns";
import { HrJobsTableSkeleton } from "@/features/hr/jobs/components/jobs-table-skeleton";
import { useHrCatalogOptions, useHrJobs } from "@/features/hr/jobs/jobs.queries";
import type { HrDeadlineFilter, HrJobFilters } from "@/features/hr/jobs/jobs.types";
import { useDebounce } from "@/hooks/use-debounce";
import type { JobStatus } from "@/types/domain/recruitment";

const emptyCounts: Record<JobStatus, number> = { DRAFT: 0, OPEN: 0, PAUSED: 0, CLOSED: 0 };
const statusValues = new Set(["DRAFT", "OPEN", "PAUSED", "CLOSED"]);
const readinessValues = new Set(["READY", "INCOMPLETE"]);
const deadlineValues = new Set(["EXPIRING", "EXPIRED"]);

export function HrJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const initialReadiness = searchParams.get("readiness");
  const initialDeadline = searchParams.get("deadline");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState<JobStatus | "ALL">(initialStatus && statusValues.has(initialStatus) ? initialStatus as JobStatus : "ALL");
  const [jobFamilyId, setJobFamilyId] = useState(searchParams.get("family") ?? "ALL");
  const [careerLevelId, setCareerLevelId] = useState(searchParams.get("level") ?? "ALL");
  const [readiness, setReadiness] = useState<NonNullable<HrJobFilters["readiness"]>>(initialReadiness && readinessValues.has(initialReadiness) ? initialReadiness as "READY" | "INCOMPLETE" : "ALL");
  const [deadline, setDeadline] = useState<HrDeadlineFilter>(initialDeadline && deadlineValues.has(initialDeadline) ? initialDeadline as HrDeadlineFilter : "ALL");
  const debouncedSearch = useDebounce(search, 300);
  const filters = useMemo(() => ({ search: debouncedSearch, status, jobFamilyId, careerLevelId, readiness, deadline }), [careerLevelId, deadline, debouncedSearch, jobFamilyId, readiness, status]);
  const jobs = useHrJobs(filters);
  const catalog = useHrCatalogOptions();
  const familyOptions = useMemo(() => [{ value: "ALL", label: "Tất cả nhóm nghề" }, ...(catalog.data?.jobFamilies.map((item) => ({ value: item.id, label: item.name })) ?? [])], [catalog.data?.jobFamilies]);
  const levelOptions = useMemo(() => [{ value: "ALL", label: "Tất cả cấp bậc" }, ...(catalog.data?.careerLevels.map((item) => ({ value: item.id, label: item.name })) ?? [])], [catalog.data?.careerLevels]);
  const filterCount = Number(Boolean(debouncedSearch)) + Number(status !== "ALL") + Number(jobFamilyId !== "ALL") + Number(careerLevelId !== "ALL") + Number(readiness !== "ALL") + Number(deadline !== "ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status !== "ALL") params.set("status", status);
    if (jobFamilyId !== "ALL") params.set("family", jobFamilyId);
    if (careerLevelId !== "ALL") params.set("level", careerLevelId);
    if (readiness !== "ALL") params.set("readiness", readiness);
    if (deadline !== "ALL") params.set("deadline", deadline);
    const query = params.toString();
    router.replace(query ? `/hr/jobs?${query}` : "/hr/jobs", { scroll: false });
  }, [careerLevelId, deadline, debouncedSearch, jobFamilyId, readiness, router, status]);

  const clear = () => { setSearch(""); setStatus("ALL"); setJobFamilyId("ALL"); setCareerLevelId("ALL"); setReadiness("ALL"); setDeadline("ALL"); };

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Không gian tuyển dụng" title="Tin tuyển dụng của tôi" description="Theo dõi các vị trí bạn phụ trách, lượng hồ sơ và mức sẵn sàng cho AI đối sánh." actions={<Button asChild><Link href="/hr/jobs/new"><Plus className="size-4" /> Tạo tin mới</Link></Button>} />
      <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
        <HrJobStatusTabs value={status} onChange={setStatus} counts={jobs.data?.statusCounts ?? emptyCounts} />
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo vị trí hoặc đơn vị..." className="w-full xl:max-w-sm" /><div className="flex flex-wrap items-center gap-2"><span className="mr-1 hidden items-center gap-2 text-xs font-medium text-muted sm:flex"><SlidersHorizontal className="size-4" /> {filterCount} bộ lọc</span><Select label="Nhóm nghề" value={jobFamilyId} onValueChange={setJobFamilyId} options={familyOptions} /><Select label="Cấp bậc" value={careerLevelId} onValueChange={setCareerLevelId} options={levelOptions} /><Select label="Đối sánh AI" value={readiness} onValueChange={(value) => setReadiness(value as NonNullable<HrJobFilters["readiness"]>)} options={[{ value: "ALL", label: "Tất cả cấu hình" }, { value: "READY", label: "Sẵn sàng AI" }, { value: "INCOMPLETE", label: "Cần hoàn thiện" }]} /><Select label="Hạn tuyển" value={deadline} onValueChange={(value) => setDeadline(value as HrDeadlineFilter)} options={[{ value: "ALL", label: "Tất cả thời hạn" }, { value: "EXPIRING", label: "Sắp hết hạn" }, { value: "EXPIRED", label: "Đã hết hạn" }]} /></div></div>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3"><p className="flex items-center gap-2 text-xs text-muted"><BriefcaseBusiness className="size-4" /><strong className="font-semibold text-ink">{jobs.data?.items.length ?? 0}</strong> tin phù hợp{jobs.isFetching && !jobs.isPending ? <span className="text-faint">· đang cập nhật</span> : null}</p><button type="button" onClick={clear} className="cursor-pointer rounded text-xs font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Xóa bộ lọc</button></div>
        </div>
        {jobs.isPending ? <HrJobsTableSkeleton /> : null}
        {jobs.isError ? <div className="p-5"><ErrorState description={jobs.error.message} onRetry={() => jobs.refetch()} /></div> : null}
        {jobs.data ? <DataTable columns={hrJobTableColumns} data={jobs.data.items} getRowId={(job) => job.id} rowClassName={(job) => !job.matchingReady && job.status !== "CLOSED" ? "bg-warning/[0.018]" : undefined} onRowClick={(job) => router.push(`/hr/jobs/${job.id}`)} emptyTitle="Không có tin tuyển dụng phù hợp" emptyDescription="Thử chọn trạng thái khác hoặc xóa bớt bộ lọc." /> : null}
      </section>
    </div>
  );
}
