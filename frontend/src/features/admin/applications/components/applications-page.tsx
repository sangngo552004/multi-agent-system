"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SortingState } from "@tanstack/react-table";
import { FileSearch, SlidersHorizontal } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { ErrorState } from "@/components/data-display/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { applicationTableColumns } from "@/features/admin/applications/components/application-table-columns";
import { ApplicationsTableSkeleton } from "@/features/admin/applications/components/applications-table-skeleton";
import { useApplications } from "@/features/admin/applications/applications.queries";
import type {
  ApplicationDateRange,
  ApplicationFilters,
} from "@/features/admin/applications/applications.types";
import { useDebounce } from "@/hooks/use-debounce";
import type { AiProcessingStatus } from "@/types/domain/admin";
import {
  readEnumParam,
  readPageIndex,
  readSorting,
} from "@/features/admin/admin-search-params";

const aiOptions = [
  { value: "ALL", label: "Mọi trạng thái AI" },
  { value: "WAITING", label: "Đang chờ" },
  { value: "PROCESSING", label: "Đang xử lý" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "FAILED", label: "Thất bại" },
];
const dateOptions = [
  { value: "ALL", label: "Mọi thời điểm" },
  { value: "7", label: "7 ngày gần đây" },
  { value: "30", label: "30 ngày gần đây" },
];
const aiStatuses = [
  "ALL",
  "WAITING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;
const applicationDateRanges = ["ALL", "7", "30"] as const;
const applicationSortFields = [
  "id",
  "jobTitle",
  "aiStatus",
  "aiConfidence",
  "submittedAt",
] as const;

export function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [aiStatus, setAiStatus] = useState<AiProcessingStatus | "ALL">(() =>
    readEnumParam(searchParams.get("aiStatus"), aiStatuses, "ALL"),
  );
  const [dateRange, setDateRange] = useState<ApplicationDateRange>(() =>
    readEnumParam(
      searchParams.get("date"),
      applicationDateRanges,
      "ALL",
    ),
  );
  const [page, setPage] = useState(() =>
    readPageIndex(searchParams.get("page")),
  );
  const [sorting, setSorting] = useState<SortingState>(() =>
    readSorting(
      searchParams.get("sort"),
      applicationSortFields,
      "submittedAt",
    ),
  );
  const debouncedSearch = useDebounce(search);
  const filters = useMemo<ApplicationFilters>(
    () => ({
      search: debouncedSearch,
      aiStatus,
      dateRange,
      page,
      size: 20,
      sort: sorting[0]
        ? `${sorting[0].id},${sorting[0].desc ? "desc" : "asc"}`
        : "submittedAt,desc",
    }),
    [aiStatus, dateRange, debouncedSearch, page, sorting],
  );
  const applications = useApplications(filters);
  const filterCount =
    Number(Boolean(debouncedSearch)) +
    Number(aiStatus !== "ALL") +
    Number(dateRange !== "ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (aiStatus !== "ALL") params.set("aiStatus", aiStatus);
    if (dateRange !== "ALL") params.set("date", dateRange);
    if (page > 0) params.set("page", String(page + 1));
    if (sorting[0]) {
      params.set(
        "sort",
        `${sorting[0].id},${sorting[0].desc ? "desc" : "asc"}`,
      );
    }
    const query = params.toString();
    router.replace(
      query ? `/admin/applications?${query}` : "/admin/applications",
      { scroll: false },
    );
  }, [aiStatus, dateRange, debouncedSearch, page, router, sorting]);

  const clear = () => {
    setSearch("");
    setAiStatus("ALL");
    setDateRange("ALL");
    setPage(0);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Giám sát vận hành AI"
        title="Xử lý hồ sơ"
        description="Theo dõi trạng thái kỹ thuật, độ tin cậy và các hồ sơ cần can thiệp; nội dung CV và đánh giá chuyên môn thuộc quyền HR."
      />
      <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Tìm mã hồ sơ, ứng viên hoặc vị trí..."
              className="w-full xl:max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              <span className="mr-1 hidden items-center gap-2 text-xs font-medium text-muted sm:flex">
                <SlidersHorizontal className="size-4" /> {filterCount} bộ lọc
              </span>
              <Select
                label="Trạng thái AI"
                value={aiStatus}
                onValueChange={(value) => {
                  setAiStatus(value as AiProcessingStatus | "ALL");
                  setPage(0);
                }}
                options={aiOptions}
              />
              <Select
                label="Ngày ứng tuyển"
                value={dateRange}
                onValueChange={(value) => {
                  setDateRange(value as ApplicationDateRange);
                  setPage(0);
                }}
                options={dateOptions}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
            <p className="flex items-center gap-2 text-xs text-muted">
              <FileSearch className="size-4" />
              <strong className="font-semibold text-ink">
                {applications.data?.totalItems ?? 0}
              </strong>{" "}
              hồ sơ phù hợp
              {applications.isFetching && !applications.isPending ? (
                <span className="text-faint">· đang cập nhật</span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={clear}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
        {applications.isPending ? <ApplicationsTableSkeleton /> : null}
        {applications.isError ? (
          <div className="p-5">
            <ErrorState
              description={applications.error.message}
              onRetry={() => applications.refetch()}
            />
          </div>
        ) : null}
        {applications.data ? (
          <DataTable
            columns={applicationTableColumns}
            data={applications.data.items}
            getRowId={(item) => item.id}
            rowClassName={(item) =>
              item.aiStatus === "FAILED" || item.needsReview
                ? "bg-warning/[0.018]"
                : undefined
            }
            onRowClick={(item) =>
              router.push(`/admin/applications/${item.id}`)
            }
            emptyTitle="Không có hồ sơ phù hợp"
            emptyDescription="Thử thay đổi trạng thái hoặc xóa bớt bộ lọc."
            server={{
              pageIndex: applications.data.page,
              pageSize: applications.data.size,
              pageCount: applications.data.totalPages,
              totalItems: applications.data.totalItems,
              onPageChange: setPage,
              sorting,
              onSortingChange: (updater) => {
                setSorting((current) =>
                  typeof updater === "function" ? updater(current) : updater,
                );
                setPage(0);
              },
            }}
          />
        ) : null}
      </section>
    </div>
  );
}
