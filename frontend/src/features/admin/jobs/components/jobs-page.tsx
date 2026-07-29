"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, SlidersHorizontal } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminInlineError } from "@/features/admin/components/admin-inline-error";
import { AdminQueryError } from "@/features/admin/components/admin-query-error";
import { JobStatusTabs } from "@/features/admin/jobs/components/job-status-tabs";
import { jobTableColumns } from "@/features/admin/jobs/components/job-table-columns";
import { JobsTableSkeleton } from "@/features/admin/jobs/components/jobs-table-skeleton";
import { useJobFilterOptions, useJobs } from "@/features/admin/jobs/jobs.queries";
import type { JobFilters } from "@/features/admin/jobs/jobs.types";
import { useDebounce } from "@/hooks/use-debounce";
import type { JobStatus } from "@/types/domain/admin";
import type { SortingState } from "@tanstack/react-table";
import {
  readEnumParam,
  readIdFilter,
  readPageIndex,
  readSorting,
} from "@/features/admin/admin-search-params";

const emptyCounts: Record<JobStatus, number> = { DRAFT: 0, OPEN: 0, PAUSED: 0, CLOSED: 0 };
const readinessOptions = [
  { value: "ALL", label: "Mọi cấu hình AI" },
  { value: "READY", label: "Sẵn sàng cho AI" },
  { value: "INCOMPLETE", label: "Thiếu cấu hình" },
];
const jobStatuses = ["ALL", "DRAFT", "OPEN", "PAUSED", "CLOSED"] as const;
const readinessValues = ["ALL", "READY", "INCOMPLETE"] as const;
const jobSortFields = ["title", "status", "createdAt"] as const;

export function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState<JobStatus | "ALL">(() =>
    readEnumParam(searchParams.get("status"), jobStatuses, "ALL"),
  );
  const [jobFamilyId, setJobFamilyId] = useState(() =>
    readIdFilter(searchParams.get("family")),
  );
  const [careerLevelId, setCareerLevelId] = useState(() =>
    readIdFilter(searchParams.get("level")),
  );
  const [readiness, setReadiness] = useState<
    NonNullable<JobFilters["readiness"]>
  >(() =>
    readEnumParam(searchParams.get("readiness"), readinessValues, "ALL"),
  );
  const [page, setPage] = useState(() =>
    readPageIndex(searchParams.get("page")),
  );
  const [sorting, setSorting] = useState<SortingState>(() =>
    readSorting(searchParams.get("sort"), jobSortFields, "createdAt"),
  );
  const debouncedSearch = useDebounce(search);
  const filters = useMemo<JobFilters>(
    () => ({
      search: debouncedSearch,
      status,
      jobFamilyId,
      careerLevelId,
      readiness,
      page,
      size: 20,
      sort: sorting[0]
        ? `${sorting[0].id},${sorting[0].desc ? "desc" : "asc"}`
        : "createdAt,desc",
    }),
    [careerLevelId, debouncedSearch, jobFamilyId, page, readiness, sorting, status],
  );
  const jobs = useJobs(filters);
  const filterOptions = useJobFilterOptions();
  const familyFilters = useMemo(() => [
    { value: "ALL", label: "Tất cả nhóm nghề" },
    ...(filterOptions.data?.jobFamilies.map((item) => ({ value: item.id, label: item.status === "ACTIVE" ? item.name : `${item.name} · Tạm ngưng` })) ?? []),
  ], [filterOptions.data?.jobFamilies]);
  const levelFilters = useMemo(() => [
    { value: "ALL", label: "Tất cả cấp bậc" },
    ...(filterOptions.data?.careerLevels.map((item) => ({ value: item.id, label: item.status === "ACTIVE" ? item.name : `${item.name} · Tạm ngưng` })) ?? []),
  ], [filterOptions.data?.careerLevels]);
  const filterCount = Number(Boolean(debouncedSearch)) + Number(status !== "ALL") + Number(jobFamilyId !== "ALL") + Number(careerLevelId !== "ALL") + Number(readiness !== "ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status !== "ALL") params.set("status", status);
    if (jobFamilyId !== "ALL") params.set("family", jobFamilyId);
    if (careerLevelId !== "ALL") params.set("level", careerLevelId);
    if (readiness !== "ALL") params.set("readiness", readiness);
    if (page > 0) params.set("page", String(page + 1));
    if (sorting[0]) params.set("sort", `${sorting[0].id},${sorting[0].desc ? "desc" : "asc"}`);
    const query = params.toString();
    router.replace(query ? `/admin/jobs?${query}` : "/admin/jobs", { scroll: false });
  }, [careerLevelId, debouncedSearch, jobFamilyId, page, readiness, router, sorting, status]);

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setJobFamilyId("ALL");
    setCareerLevelId("ALL");
    setReadiness("ALL");
    setPage(0);
  };

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Giám sát dữ liệu tuyển dụng" title="Tin tuyển dụng" description="Theo dõi trạng thái do HR quản lý và phát hiện tin còn thiếu dữ liệu để hệ thống AI đối sánh." />
      <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
        <JobStatusTabs value={status} onChange={(value) => { setStatus(value); setPage(0); }} counts={jobs.data?.statusCounts ?? emptyCounts} />
        {filterOptions.isError ? (
          <AdminInlineError
            error={filterOptions.error}
            fallbackDescription="Chưa thể tải nhóm nghề và cấp bậc. Các bộ lọc này tạm thời không khả dụng."
            onRetry={() => filterOptions.refetch()}
            retrying={filterOptions.isFetching}
          />
        ) : null}
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Tìm theo vị trí, HR hoặc đơn vị..." className="w-full xl:max-w-sm" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 hidden items-center gap-2 text-xs font-medium text-muted sm:flex"><SlidersHorizontal className="size-4" /> {filterCount} bộ lọc</span>
              <Select label="Nhóm nghề" value={jobFamilyId} onValueChange={(value) => { setJobFamilyId(value); setPage(0); }} options={familyFilters} disabled={filterOptions.isError} />
              <Select label="Cấp bậc" value={careerLevelId} onValueChange={(value) => { setCareerLevelId(value); setPage(0); }} options={levelFilters} disabled={filterOptions.isError} />
              <Select label="Cấu hình AI" value={readiness} onValueChange={(value) => { setReadiness(value as NonNullable<JobFilters["readiness"]>); setPage(0); }} options={readinessOptions} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
            <p className="flex items-center gap-2 text-xs text-muted"><BriefcaseBusiness className="size-4" /><strong className="font-semibold text-ink">{jobs.data?.totalItems ?? 0}</strong> tin phù hợp{jobs.isFetching && !jobs.isPending ? <span className="text-faint">· đang cập nhật</span> : null}</p>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-brand hover:underline">Xóa bộ lọc</button>
          </div>
        </div>
        {jobs.isPending ? <div className="overflow-hidden"><JobsTableSkeleton /></div> : null}
        {jobs.isError ? (
          <div className="p-5">
            <AdminQueryError
              error={jobs.error}
              fallbackDescription="Chưa thể tải danh sách tin tuyển dụng lúc này."
              onRetry={() => jobs.refetch()}
              retrying={jobs.isFetching}
            />
          </div>
        ) : null}
        {jobs.data ? <DataTable columns={jobTableColumns} data={jobs.data.items} getRowId={(job) => job.id} rowClassName={(job) => !job.matchingReady && job.status !== "CLOSED" ? "bg-warning/[0.018]" : undefined} onRowClick={(job) => router.push(`/admin/jobs/${job.id}`)} emptyTitle="Không có tin tuyển dụng phù hợp" emptyDescription="Thử chọn trạng thái khác hoặc xóa bớt bộ lọc." server={{ pageIndex: jobs.data.page, pageSize: jobs.data.size, pageCount: jobs.data.totalPages, totalItems: jobs.data.totalItems, onPageChange: setPage, sorting, onSortingChange: (updater) => { setSorting((current) => typeof updater === "function" ? updater(current) : updater); setPage(0); } }} /> : null}
      </section>
    </div>
  );
}
