"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, SlidersHorizontal } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { JobStatusTabs } from "@/features/admin/jobs/components/job-status-tabs";
import { jobTableColumns } from "@/features/admin/jobs/components/job-table-columns";
import { JobsTableSkeleton } from "@/features/admin/jobs/components/jobs-table-skeleton";
import { useJobs } from "@/features/admin/jobs/jobs.queries";
import type { JobFilters } from "@/features/admin/jobs/jobs.types";
import { useKnowledge } from "@/features/admin/knowledge/knowledge.queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { JobStatus } from "@/types/domain/admin";

const emptyCounts: Record<JobStatus, number> = { DRAFT: 0, OPEN: 0, PAUSED: 0, CLOSED: 0 };
const readinessOptions = [
  { value: "ALL", label: "Mọi cấu hình AI" },
  { value: "READY", label: "Sẵn sàng cho AI" },
  { value: "INCOMPLETE", label: "Thiếu cấu hình" },
];

export function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState<JobStatus | "ALL">((searchParams.get("status") as JobStatus) ?? "ALL");
  const [jobFamilyId, setJobFamilyId] = useState(searchParams.get("family") ?? "ALL");
  const [careerLevelId, setCareerLevelId] = useState(searchParams.get("level") ?? "ALL");
  const [readiness, setReadiness] = useState<NonNullable<JobFilters["readiness"]>>((searchParams.get("readiness") as NonNullable<JobFilters["readiness"]>) ?? "ALL");
  const debouncedSearch = useDebounce(search);
  const filters = useMemo<JobFilters>(() => ({ search: debouncedSearch, status, jobFamilyId, careerLevelId, readiness }), [careerLevelId, debouncedSearch, jobFamilyId, readiness, status]);
  const jobs = useJobs(filters);
  const knowledge = useKnowledge();
  const familyFilters = useMemo(() => [
    { value: "ALL", label: "Tất cả nhóm nghề" },
    ...(knowledge.data?.jobFamilies.map((item) => ({ value: item.id, label: item.status === "ACTIVE" ? item.name : `${item.name} · Tạm ngưng` })) ?? []),
  ], [knowledge.data?.jobFamilies]);
  const levelFilters = useMemo(() => [
    { value: "ALL", label: "Tất cả cấp bậc" },
    ...(knowledge.data?.careerLevels.map((item) => ({ value: item.id, label: item.status === "ACTIVE" ? item.name : `${item.name} · Tạm ngưng` })) ?? []),
  ], [knowledge.data?.careerLevels]);
  const filterCount = Number(Boolean(debouncedSearch)) + Number(status !== "ALL") + Number(jobFamilyId !== "ALL") + Number(careerLevelId !== "ALL") + Number(readiness !== "ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status !== "ALL") params.set("status", status);
    if (jobFamilyId !== "ALL") params.set("family", jobFamilyId);
    if (careerLevelId !== "ALL") params.set("level", careerLevelId);
    if (readiness !== "ALL") params.set("readiness", readiness);
    const query = params.toString();
    router.replace(query ? `/admin/jobs?${query}` : "/admin/jobs", { scroll: false });
  }, [careerLevelId, debouncedSearch, jobFamilyId, readiness, router, status]);

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setJobFamilyId("ALL");
    setCareerLevelId("ALL");
    setReadiness("ALL");
  };

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Giám sát dữ liệu tuyển dụng" title="Tin tuyển dụng" description="Theo dõi trạng thái do HR quản lý và phát hiện tin còn thiếu dữ liệu để hệ thống AI đối sánh." />
      <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
        <JobStatusTabs value={status} onChange={setStatus} counts={jobs.data?.statusCounts ?? emptyCounts} />
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo vị trí, HR hoặc đơn vị..." className="w-full xl:max-w-sm" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 hidden items-center gap-2 text-xs font-medium text-muted sm:flex"><SlidersHorizontal className="size-4" /> {filterCount} bộ lọc</span>
              <Select label="Nhóm nghề" value={jobFamilyId} onValueChange={setJobFamilyId} options={familyFilters} />
              <Select label="Cấp bậc" value={careerLevelId} onValueChange={setCareerLevelId} options={levelFilters} />
              <Select label="Cấu hình AI" value={readiness} onValueChange={(value) => setReadiness(value as NonNullable<JobFilters["readiness"]>)} options={readinessOptions} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
            <p className="flex items-center gap-2 text-xs text-muted"><BriefcaseBusiness className="size-4" /><strong className="font-semibold text-ink">{jobs.data?.items.length ?? 0}</strong> tin phù hợp{jobs.isFetching && !jobs.isPending ? <span className="text-faint">· đang cập nhật</span> : null}</p>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-brand hover:underline">Xóa bộ lọc</button>
          </div>
        </div>
        {jobs.isPending ? <div className="overflow-hidden"><JobsTableSkeleton /></div> : null}
        {jobs.isError ? <div className="p-5"><ErrorState description={jobs.error.message} onRetry={() => jobs.refetch()} /></div> : null}
        {jobs.data ? <DataTable columns={jobTableColumns} data={jobs.data.items} getRowId={(job) => job.id} rowClassName={(job) => !job.matchingReady && job.status !== "CLOSED" ? "bg-warning/[0.018]" : undefined} onRowClick={(job) => router.push(`/admin/jobs/${job.id}`)} emptyTitle="Không có tin tuyển dụng phù hợp" emptyDescription="Thử chọn trạng thái khác hoặc xóa bớt bộ lọc." /> : null}
      </section>
    </div>
  );
}
