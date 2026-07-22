import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, CircleCheck, CircleDashed } from "lucide-react";
import { SortableHeader } from "@/components/data-display/data-table";
import { StatusDot } from "@/components/ui/status-dot";
import { jobStatusMap } from "@/config/status";
import type { JobListItem } from "@/features/admin/jobs/jobs.types";
import { formatDate } from "@/lib/format";

export const jobTableColumns: ColumnDef<JobListItem>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader label="Tin tuyển dụng" column={column} />,
    cell: ({ row }) => (
      <div className="relative pl-3">
        {!row.original.matchingReady && row.original.status !== "CLOSED" ? (
          <span className="absolute bottom-0 left-0 top-0 w-[3px] rounded-full bg-accent" aria-hidden />
        ) : null}
        <p className="font-semibold text-ink">{row.original.title}</p>
        <p className="mt-1 text-xs text-muted">{row.original.departmentName}</p>
      </div>
    ),
  },
  {
    accessorKey: "ownerName",
    header: ({ column }) => <SortableHeader label="HR phụ trách" column={column} />,
    cell: ({ row }) => <span className="text-sm text-muted">{row.original.ownerName}</span>,
  },
  {
    id: "classification",
    accessorFn: (row) => `${row.jobFamilyName ?? ""} ${row.careerLevelName ?? ""}`,
    header: "Nhóm nghề / Cấp bậc",
    cell: ({ row }) => (
      <div>
        <p className="text-sm text-ink">{row.original.jobFamilyName ?? "Chưa phân loại"}</p>
        <p className="mt-1 text-xs text-muted">{row.original.careerLevelName ?? "Chưa có cấp bậc"}</p>
      </div>
    ),
  },
  {
    accessorKey: "applicationCount",
    header: ({ column }) => <SortableHeader label="Số ứng viên" column={column} />,
    cell: ({ row }) => <span className="text-sm font-semibold tabular-nums text-ink">{row.original.applicationCount}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader label="Trạng thái" column={column} />,
    cell: ({ row }) => {
      const status = jobStatusMap[row.original.status];
      return <StatusDot label={status.label} tone={status.tone} />;
    },
  },
  {
    id: "matching",
    accessorFn: (row) => row.matchingReady,
    header: "Cấu hình đối sánh",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        {row.original.matchingReady ? <CircleCheck className="size-4 text-success" /> : <CircleDashed className="size-4 text-warning" />}
        {row.original.matchingReady ? "Sẵn sàng" : "Thiếu cấu hình"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader label="Ngày tạo" column={column} />,
    cell: ({ row }) => <span className="text-xs text-muted">{formatDate(row.original.createdAt)}</span>,
  },
  {
    id: "open",
    header: "",
    enableSorting: false,
    cell: () => <ArrowUpRight className="ml-auto size-4 text-faint" />,
  },
];
