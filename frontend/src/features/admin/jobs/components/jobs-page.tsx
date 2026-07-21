"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, SlidersHorizontal } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { JobStatusTabs } from "@/features/admin/jobs/components/job-status-tabs";
import { jobTableColumns } from "@/features/admin/jobs/components/job-table-columns";
import { JobsTableSkeleton } from "@/features/admin/jobs/components/jobs-table-skeleton";
import { useJobs } from "@/features/admin/jobs/jobs.queries";
import type { JobFilters } from "@/features/admin/jobs/jobs.types";
import { useKnowledge } from "@/features/admin/knowledge/knowledge.queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { JobStatus } from "@/types/domain/admin";
import type { JobModerationState } from "@/types/domain/admin";

const emptyCounts: Record<JobStatus, number> = { PENDING: 0, PUBLISHED: 0, HIDDEN: 0, CLOSED: 0 };

export function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState<JobStatus | "ALL">((searchParams.get("status") as JobStatus) ?? "ALL");
  const [jobFamilyId, setJobFamilyId] = useState(searchParams.get("family") ?? "ALL");
  const [careerLevelId, setCareerLevelId] = useState(searchParams.get("level") ?? "ALL");
  const [moderationState, setModerationState] = useState<JobModerationState | "ALL">((searchParams.get("moderation") as JobModerationState) ?? "ALL");
  const debouncedSearch = useDebounce(search);
  const filters = useMemo<JobFilters>(() => ({ search: debouncedSearch, status, jobFamilyId, careerLevelId, moderationState }), [careerLevelId, debouncedSearch, jobFamilyId, moderationState, status]);
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
  const filterCount = Number(Boolean(debouncedSearch)) + Number(status !== "ALL") + Number(jobFamilyId !== "ALL") + Number(careerLevelId !== "ALL") + Number(moderationState !== "ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status !== "ALL") params.set("status", status);
    if (jobFamilyId !== "ALL") params.set("family", jobFamilyId);
    if (careerLevelId !== "ALL") params.set("level", careerLevelId);
    if (moderationState !== "ALL") params.set("moderation", moderationState);
    const query = params.toString();
    router.replace(query ? `/admin/jobs?${query}` : "/admin/jobs", { scroll: false });
  }, [careerLevelId, debouncedSearch, jobFamilyId, moderationState, router, status]);

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setJobFamilyId("ALL");
    setCareerLevelId("ALL");
    setModerationState("ALL");
  };

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Kiểm duyệt nội dung" title="Tin tuyển dụng" description="Kiểm tra nội dung, cấu hình matching và quyết định tin nào được hiển thị cho ứng viên." />
      <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
        <JobStatusTabs value={status} onChange={(nextStatus) => { setStatus(nextStatus); setModerationState("ALL"); }} counts={jobs.data?.statusCounts ?? emptyCounts} />
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tiêu đề, HR hoặc công ty..." className="w-full xl:max-w-sm" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 hidden items-center gap-2 text-xs font-medium text-muted sm:flex"><SlidersHorizontal className="size-4" /> {filterCount} bộ lọc</span>
              <Select label="Nhóm nghề" value={jobFamilyId} onValueChange={setJobFamilyId} options={familyFilters} />
              <Select label="Cấp bậc" value={careerLevelId} onValueChange={setCareerLevelId} options={levelFilters} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted"><BriefcaseBusiness className="size-4" /><span><strong className="font-semibold text-ink">{jobs.data?.items.length ?? 0}</strong> tin phù hợp</span>{moderationState === "AWAITING" ? <Badge tone="info">Cần Admin xử lý</Badge> : null}{jobs.isFetching && !jobs.isPending ? <span className="text-faint">· đang cập nhật</span> : null}</p>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-brand hover:underline">Xóa bộ lọc</button>
          </div>
        </div>
        {jobs.isPending ? <div className="overflow-hidden"><JobsTableSkeleton /></div> : null}
        {jobs.isError ? <div className="p-5"><ErrorState description={jobs.error.message} onRetry={() => jobs.refetch()} /></div> : null}
        {jobs.data ? <DataTable columns={jobTableColumns} data={jobs.data.items} getRowId={(job) => job.id} rowClassName={(job) => job.status === "PENDING" && job.moderationState === "AWAITING" ? "bg-warning/[0.018]" : undefined} onRowClick={(job) => router.push(`/admin/jobs/${job.id}`)} emptyTitle="Không có tin tuyển dụng phù hợp" emptyDescription="Thử chọn trạng thái khác hoặc xóa bớt bộ lọc." /> : null}
      </section>
    </div>
  );
}
