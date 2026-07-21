"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileSearch, SlidersHorizontal } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { applicationTableColumns } from "@/features/admin/applications/components/application-table-columns";
import { ApplicationsTableSkeleton } from "@/features/admin/applications/components/applications-table-skeleton";
import { useApplications } from "@/features/admin/applications/applications.queries";
import type { ApplicationDateRange, ApplicationFilters, ScoreBand } from "@/features/admin/applications/applications.types";
import { useDebounce } from "@/hooks/use-debounce";
import type { AiProcessingStatus, RecruitmentStatus } from "@/types/domain/admin";

const recruitmentOptions = [{ value: "ALL", label: "Mọi trạng thái tuyển dụng" }, { value: "PENDING", label: "Mới nộp" }, { value: "REVIEWING", label: "Đang xem xét" }, { value: "SHORTLISTED", label: "Danh sách ngắn" }, { value: "REJECTED", label: "Không phù hợp" }, { value: "HIRED", label: "Đã tuyển" }];
const aiOptions = [{ value: "ALL", label: "Mọi trạng thái AI" }, { value: "WAITING", label: "Đang chờ" }, { value: "PROCESSING", label: "Đang xử lý" }, { value: "COMPLETED", label: "Hoàn thành" }, { value: "FAILED", label: "Thất bại" }];
const scoreOptions = [{ value: "ALL", label: "Mọi mức điểm" }, { value: "HIGH", label: "Từ 80%" }, { value: "MEDIUM", label: "65–79%" }, { value: "LOW", label: "Dưới 65%" }, { value: "UNSCORED", label: "Chưa có điểm" }];
const dateOptions = [{ value: "ALL", label: "Mọi thời điểm" }, { value: "7", label: "7 ngày gần đây" }, { value: "30", label: "30 ngày gần đây" }];

export function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus | "ALL">((searchParams.get("recruitmentStatus") as RecruitmentStatus) ?? "ALL");
  const [aiStatus, setAiStatus] = useState<AiProcessingStatus | "ALL">((searchParams.get("aiStatus") as AiProcessingStatus) ?? "ALL");
  const [scoreBand, setScoreBand] = useState<ScoreBand>((searchParams.get("score") as ScoreBand) ?? "ALL");
  const [dateRange, setDateRange] = useState<ApplicationDateRange>((searchParams.get("date") as ApplicationDateRange) ?? "ALL");
  const debouncedSearch = useDebounce(search);
  const filters = useMemo<ApplicationFilters>(() => ({ search: debouncedSearch, recruitmentStatus, aiStatus, scoreBand, dateRange }), [aiStatus, dateRange, debouncedSearch, recruitmentStatus, scoreBand]);
  const applications = useApplications(filters);
  const filterCount = Number(Boolean(debouncedSearch)) + Number(recruitmentStatus !== "ALL") + Number(aiStatus !== "ALL") + Number(scoreBand !== "ALL") + Number(dateRange !== "ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (recruitmentStatus !== "ALL") params.set("recruitmentStatus", recruitmentStatus);
    if (aiStatus !== "ALL") params.set("aiStatus", aiStatus);
    if (scoreBand !== "ALL") params.set("score", scoreBand);
    if (dateRange !== "ALL") params.set("date", dateRange);
    const query = params.toString();
    router.replace(query ? `/admin/applications?${query}` : "/admin/applications", { scroll: false });
  }, [aiStatus, dateRange, debouncedSearch, recruitmentStatus, router, scoreBand]);

  const clear = () => { setSearch(""); setRecruitmentStatus("ALL"); setAiStatus("ALL"); setScoreBand("ALL"); setDateRange("ALL"); };

  return <div className="space-y-7">
    <PageHeader eyebrow="Giám sát quy trình AI" title="Hồ sơ ứng tuyển" description="Theo dõi riêng trạng thái tuyển dụng và trạng thái AI, kiểm tra các hồ sơ cần can thiệp." />
    <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
      <div className="border-b border-border p-4 sm:p-5">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã hồ sơ, ứng viên hoặc việc làm..." className="w-full 2xl:max-w-sm" /><div className="flex flex-wrap gap-2"><span className="mr-1 hidden items-center gap-2 text-xs font-medium text-muted sm:flex"><SlidersHorizontal className="size-4" /> {filterCount} bộ lọc</span><Select label="Trạng thái tuyển dụng" value={recruitmentStatus} onValueChange={(value) => setRecruitmentStatus(value as RecruitmentStatus | "ALL")} options={recruitmentOptions} /><Select label="Trạng thái AI" value={aiStatus} onValueChange={(value) => setAiStatus(value as AiProcessingStatus | "ALL")} options={aiOptions} /><Select label="Mức điểm" value={scoreBand} onValueChange={(value) => setScoreBand(value as ScoreBand)} options={scoreOptions} /><Select label="Ngày ứng tuyển" value={dateRange} onValueChange={(value) => setDateRange(value as ApplicationDateRange)} options={dateOptions} /></div></div>
        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3"><p className="flex items-center gap-2 text-xs text-muted"><FileSearch className="size-4" /><strong className="font-semibold text-ink">{applications.data?.length ?? 0}</strong> hồ sơ phù hợp{applications.isFetching && !applications.isPending ? <span className="text-faint">· đang cập nhật</span> : null}</p><button onClick={clear} className="text-xs font-semibold text-brand hover:underline">Xóa bộ lọc</button></div>
      </div>
      {applications.isPending ? <ApplicationsTableSkeleton /> : null}
      {applications.isError ? <div className="p-5"><ErrorState description={applications.error.message} onRetry={() => applications.refetch()} /></div> : null}
      {applications.data ? <DataTable columns={applicationTableColumns} data={applications.data} getRowId={(item) => item.id} rowClassName={(item) => item.aiStatus === "FAILED" || item.needsReview ? "bg-warning/[0.018]" : undefined} onRowClick={(item) => router.push(`/admin/applications/${item.id}`)} emptyTitle="Không có hồ sơ phù hợp" emptyDescription="Thử thay đổi trạng thái hoặc xóa bớt bộ lọc." /> : null}
    </section>
  </div>;
}
