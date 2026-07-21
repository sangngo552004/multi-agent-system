import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { SortableHeader } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { aiStatusMap, recruitmentStatusMap } from "@/config/status";
import { ApplicationScore } from "@/features/admin/applications/components/application-score";
import type { ApplicationListItem } from "@/features/admin/applications/applications.types";
import { formatDate } from "@/lib/format";

export const applicationTableColumns: ColumnDef<ApplicationListItem>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader label="Hồ sơ" column={column} />,
    cell: ({ row }) => (
      <div className="relative pl-3">
        {row.original.aiStatus === "FAILED" || row.original.needsReview ? <span className="absolute bottom-0 left-0 top-0 w-[3px] rounded-full bg-accent" /> : null}
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-brand">{row.original.id}</p>
        <p className="mt-1 text-sm font-semibold text-ink">{row.original.candidateName}</p>
      </div>
    ),
  },
  {
    accessorKey: "jobTitle",
    header: ({ column }) => <SortableHeader label="Tin tuyển dụng" column={column} />,
    cell: ({ row }) => <div><p className="text-sm text-ink">{row.original.jobTitle}</p><p className="mt-1 text-xs text-muted">{row.original.companyName}</p></div>,
  },
  {
    accessorKey: "recruitmentStatus",
    header: ({ column }) => <SortableHeader label="Tuyển dụng" column={column} />,
    cell: ({ row }) => { const status = recruitmentStatusMap[row.original.recruitmentStatus]; return <StatusDot label={status.label} tone={status.tone} />; },
  },
  {
    accessorKey: "aiStatus",
    header: ({ column }) => <SortableHeader label="Xử lý AI" column={column} />,
    cell: ({ row }) => { const status = aiStatusMap[row.original.aiStatus]; return <div className="space-y-1.5"><StatusDot label={status.label} tone={status.tone} />{row.original.needsReview && row.original.aiStatus !== "FAILED" ? <Badge tone="warning">Cần kiểm tra</Badge> : null}</div>; },
  },
  {
    accessorKey: "matchScore",
    header: ({ column }) => <SortableHeader label="Điểm phù hợp" column={column} />,
    cell: ({ row }) => <ApplicationScore score={row.original.matchScore} />,
  },
  {
    accessorKey: "submittedAt",
    header: ({ column }) => <SortableHeader label="Ngày ứng tuyển" column={column} />,
    cell: ({ row }) => <span className="text-xs text-muted">{formatDate(row.original.submittedAt, "dd/MM/yyyy · HH:mm")}</span>,
  },
  { id: "open", header: "", enableSorting: false, cell: () => <ArrowUpRight className="ml-auto size-4 text-faint" /> },
];
