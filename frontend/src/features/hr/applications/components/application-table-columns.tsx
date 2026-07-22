import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, CircleAlert } from "lucide-react";
import { SortableHeader } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { aiStatusMap, recruitmentStatusMap } from "@/config/status";
import type { HrApplicationListItem } from "@/features/hr/applications/applications.types";
import { formatDate } from "@/lib/format";

export const hrApplicationTableColumns: ColumnDef<HrApplicationListItem>[] = [
  {
    accessorKey: "candidateName",
    header: ({ column }) => <SortableHeader label="Ứng viên" column={column} />,
    cell: ({ row }) => <div className="relative min-w-48 pl-3">{row.original.recruitmentStatus === "PENDING" ? <span className="absolute inset-y-0 left-0 w-[3px] rounded-full bg-signal" /> : null}<p className="font-semibold text-ink">{row.original.candidateName}</p><p className="mt-1 text-xs text-muted">{row.original.candidateEmail}</p></div>,
  },
  {
    accessorKey: "jobTitle",
    header: ({ column }) => <SortableHeader label="Vị trí ứng tuyển" column={column} />,
    cell: ({ row }) => <div className="min-w-40"><p className="text-sm text-ink">{row.original.jobTitle}</p><p className="mt-1 text-xs text-muted">{row.original.departmentName}</p></div>,
  },
  {
    accessorKey: "submittedAt",
    header: ({ column }) => <SortableHeader label="Ngày nộp" column={column} />,
    cell: ({ row }) => <span className="whitespace-nowrap text-xs text-muted">{formatDate(row.original.submittedAt, "dd/MM/yyyy · HH:mm")}</span>,
  },
  {
    accessorKey: "recruitmentStatus",
    header: "Trạng thái tuyển dụng",
    cell: ({ row }) => { const status = recruitmentStatusMap[row.original.recruitmentStatus]; return <StatusDot label={status.label} tone={status.tone} />; },
  },
  {
    accessorKey: "aiStatus",
    header: "Xử lý AI",
    cell: ({ row }) => { const status = aiStatusMap[row.original.aiStatus]; return <div className="space-y-1.5"><StatusDot label={status.label} tone={status.tone} />{row.original.needsReview || row.original.aiConfidence < 0.75 ? <Badge tone="warning"><CircleAlert className="mr-1 size-3" /> Cần đối chiếu</Badge> : null}</div>; },
  },
  {
    accessorKey: "matchScore",
    header: ({ column }) => <SortableHeader label="Điểm đối sánh" column={column} />,
    cell: ({ row }) => row.original.matchScore === undefined ? <span className="text-xs text-faint">Chưa có</span> : <div><span className="text-lg font-semibold tabular-nums text-ink">{row.original.matchScore}</span><span className="text-xs text-muted">/100</span><p className="mt-1 text-[11px] text-muted">Tin cậy {Math.round(row.original.aiConfidence * 100)}%</p></div>,
  },
  { id: "open", header: "", enableSorting: false, cell: () => <ArrowUpRight className="ml-auto size-4 text-faint" /> },
];
