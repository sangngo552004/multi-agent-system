"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, Inbox, SlidersHorizontal } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { hrApplicationTableColumns } from "@/features/hr/applications/components/application-table-columns";
import { HrApplicationsSkeleton } from "@/features/hr/applications/components/applications-skeleton";
import { useHrApplications } from "@/features/hr/applications/applications.queries";
import type { HrApplicationDateRange, HrApplicationFilters, HrApplicationSort } from "@/features/hr/applications/applications.types";
import { useHrJobs } from "@/features/hr/jobs/jobs.queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { AiProcessingStatus, RecruitmentStatus } from "@/types/domain/recruitment";

const recruitmentValues = new Set(["PENDING", "REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"]);
const aiValues = new Set(["WAITING", "PROCESSING", "COMPLETED", "FAILED"]);

export function HrApplicationsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [jobId, setJobId] = useState(params.get("jobId") ?? "ALL");
  const statusParam = params.get("status");
  const aiParam = params.get("aiStatus");
  const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus | "ALL">(statusParam && recruitmentValues.has(statusParam) ? statusParam as RecruitmentStatus : "ALL");
  const [aiStatus, setAiStatus] = useState<AiProcessingStatus | "ALL">(aiParam && aiValues.has(aiParam) ? aiParam as AiProcessingStatus : "ALL");
  const [dateRange, setDateRange] = useState<HrApplicationDateRange>((params.get("date") as HrApplicationDateRange) || "ALL");
  const [review, setReview] = useState<"ALL" | "REQUIRED">(params.get("review") === "REQUIRED" ? "REQUIRED" : "ALL");
  const [sort, setSort] = useState<HrApplicationSort>((params.get("sort") as HrApplicationSort) || "SUBMITTED_DESC");
  const debouncedSearch = useDebounce(search, 300);
  const filters = useMemo<HrApplicationFilters>(() => ({ search: debouncedSearch, jobId, recruitmentStatus, aiStatus, dateRange, review, sort }), [aiStatus, dateRange, debouncedSearch, jobId, recruitmentStatus, review, sort]);
  const applications = useHrApplications(filters);
  const jobs = useHrJobs({});
  const filterCount = Number(Boolean(debouncedSearch)) + Number(jobId !== "ALL") + Number(recruitmentStatus !== "ALL") + Number(aiStatus !== "ALL") + Number(dateRange !== "ALL") + Number(review !== "ALL");

  useEffect(() => {
    const query = new URLSearchParams();
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (jobId !== "ALL") query.set("jobId", jobId);
    if (recruitmentStatus !== "ALL") query.set("status", recruitmentStatus);
    if (aiStatus !== "ALL") query.set("aiStatus", aiStatus);
    if (dateRange !== "ALL") query.set("date", dateRange);
    if (review !== "ALL") query.set("review", review);
    if (sort !== "SUBMITTED_DESC") query.set("sort", sort);
    router.replace(query.size ? `/hr/applications?${query}` : "/hr/applications", { scroll: false });
  }, [aiStatus, dateRange, debouncedSearch, jobId, recruitmentStatus, review, router, sort]);

  const clear = () => { setSearch(""); setJobId("ALL"); setRecruitmentStatus("ALL"); setAiStatus("ALL"); setDateRange("ALL"); setReview("ALL"); setSort("SUBMITTED_DESC"); };
  const result = applications.data ?? [];
  const newCount = result.filter((item) => item.recruitmentStatus === "PENDING").length;
  const warningCount = result.filter((item) => item.aiStatus === "FAILED" || item.needsReview || item.aiConfidence < 0.75).length;

  return <div className="space-y-7">
    <PageHeader eyebrow="Hàng đợi tuyển dụng" title="Hồ sơ ứng viên" description="Đọc hồ sơ, đối chiếu bằng chứng AI và đưa ra quyết định cho các vị trí bạn phụ trách." />
    <div className="grid gap-px overflow-hidden rounded-[12px] border border-border bg-border sm:grid-cols-3">
      <Summary label="Hồ sơ phù hợp bộ lọc" value={result.length} icon={<Inbox className="size-5" />} />
      <Summary label="Hồ sơ mới" value={newCount} note="Chưa bắt đầu xem xét" />
      <Summary label="Cần đối chiếu" value={warningCount} note="AI lỗi hoặc độ tin cậy thấp" warning />
    </div>
    <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
      <div className="border-b border-border p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc email ứng viên..." className="w-full xl:max-w-sm" /><div className="flex flex-wrap items-center gap-2"><span className="hidden items-center gap-2 text-xs text-muted sm:flex"><SlidersHorizontal className="size-4" /> {filterCount} bộ lọc</span><Select label="Vị trí" value={jobId} onValueChange={setJobId} options={[{ value: "ALL", label: "Tất cả vị trí" }, ...(jobs.data?.items.map((job) => ({ value: job.id, label: job.title })) ?? [])]} /><Select label="Trạng thái tuyển dụng" value={recruitmentStatus} onValueChange={(value) => setRecruitmentStatus(value as RecruitmentStatus | "ALL")} options={[{ value: "ALL", label: "Tất cả trạng thái" }, { value: "PENDING", label: "Mới nhận" }, { value: "REVIEWING", label: "Đang xem xét" }, { value: "SHORTLISTED", label: "Danh sách ngắn" }, { value: "REJECTED", label: "Không phù hợp" }, { value: "HIRED", label: "Đã tuyển" }]} /><Select label="Xử lý AI" value={aiStatus} onValueChange={(value) => setAiStatus(value as AiProcessingStatus | "ALL")} options={[{ value: "ALL", label: "Tất cả trạng thái AI" }, { value: "WAITING", label: "Đang chờ" }, { value: "PROCESSING", label: "Đang xử lý" }, { value: "COMPLETED", label: "Hoàn thành" }, { value: "FAILED", label: "Thất bại" }]} /></div></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3"><div className="flex flex-wrap gap-2"><Select label="Ngày nộp" value={dateRange} onValueChange={(value) => setDateRange(value as HrApplicationDateRange)} options={[{ value: "ALL", label: "Mọi thời điểm" }, { value: "7", label: "7 ngày gần đây" }, { value: "30", label: "30 ngày gần đây" }]} /><Select label="Mức lưu ý" value={review} onValueChange={(value) => setReview(value as "ALL" | "REQUIRED")} options={[{ value: "ALL", label: "Tất cả hồ sơ" }, { value: "REQUIRED", label: "Cần đối chiếu CV" }]} /><Select label="Sắp xếp" value={sort} onValueChange={(value) => setSort(value as HrApplicationSort)} options={[{ value: "SUBMITTED_DESC", label: "Nộp gần nhất" }, { value: "UPDATED_DESC", label: "Cập nhật gần nhất" }, { value: "SCORE_DESC", label: "Điểm cao đến thấp" }]} /></div><button type="button" onClick={clear} className="cursor-pointer text-xs font-semibold text-brand hover:underline">Xóa bộ lọc</button></div>
      </div>
      {applications.isPending ? <HrApplicationsSkeleton /> : null}
      {applications.isError ? <div className="p-5"><ErrorState title="Không thể tải hồ sơ" description={applications.error.message} onRetry={() => applications.refetch()} /></div> : null}
      {applications.data ? <DataTable columns={hrApplicationTableColumns} data={applications.data} getRowId={(item) => item.id} onRowClick={(item) => router.push(`/hr/applications/${item.id}`)} rowClassName={(item) => item.aiStatus === "FAILED" ? "bg-danger/[0.018]" : item.needsReview ? "bg-warning/[0.018]" : undefined} emptyTitle="Không có hồ sơ phù hợp" emptyDescription="Thử thay đổi vị trí, trạng thái hoặc khoảng ngày đang lọc." /> : null}
    </section>
    <p className="flex items-start gap-2 text-xs leading-5 text-muted"><CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" /> Điểm đối sánh là dữ liệu hỗ trợ. HR cần đọc CV và bằng chứng trước khi đưa ra quyết định; hệ thống không tự động loại ứng viên.</p>
  </div>;
}

function Summary({ label, value, note, icon, warning }: { label: string; value: number; note?: string; icon?: React.ReactNode; warning?: boolean }) {
  return <div className="bg-surface px-5 py-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted">{label}</p>{icon ?? (warning ? <CircleAlert className="size-4 text-warning" /> : null)}</div><p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">{value}</p>{note ? <p className="mt-1 text-[11px] text-muted">{note}</p> : null}</div>;
}
