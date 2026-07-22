import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { SortableHeader } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { aiStatusMap } from "@/config/status";
import type { ApplicationListItem } from "@/features/admin/applications/applications.types";
import { formatDate } from "@/lib/format";

export const applicationTableColumns: ColumnDef<ApplicationListItem>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader label="Hồ sơ" column={column} />,
    cell: ({ row }) => <div className="relative pl-3">{row.original.aiStatus === "FAILED" || row.original.needsReview ? <span className="absolute bottom-0 left-0 top-0 w-[3px] rounded-full bg-accent" /> : null}<p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-brand">{row.original.id}</p><p className="mt-1 text-sm font-semibold text-ink">{row.original.candidateName}</p></div>,
  },
  {
    accessorKey: "jobTitle",
    header: ({ column }) => <SortableHeader label="Vị trí tuyển dụng" column={column} />,
    cell: ({ row }) => <div><p className="text-sm text-ink">{row.original.jobTitle}</p><p className="mt-1 text-xs text-muted">{row.original.departmentName}</p></div>,
  },
  {
    accessorKey: "aiStatus",
    header: ({ column }) => <SortableHeader label="Xử lý AI" column={column} />,
    cell: ({ row }) => { const status = aiStatusMap[row.original.aiStatus]; return <div className="space-y-1.5"><StatusDot label={status.label} tone={status.tone} />{row.original.needsReview && row.original.aiStatus !== "FAILED" ? <Badge tone="warning">Cần kiểm tra</Badge> : null}</div>; },
  },
  {
    accessorKey: "extractionMethod",
    header: "Phương thức đọc",
    cell: ({ row }) => <span className="text-xs text-muted">{row.original.extractionMethod === "OCR" ? "Nhận dạng hình ảnh" : "Lớp văn bản"}</span>,
  },
  {
    accessorKey: "aiConfidence",
    header: ({ column }) => <SortableHeader label="Độ tin cậy" column={column} />,
    cell: ({ row }) => <span className="text-sm font-semibold tabular-nums text-ink">{Math.round(row.original.aiConfidence * 100)}%</span>,
  },
  {
    accessorKey: "submittedAt",
    header: ({ column }) => <SortableHeader label="Thời điểm tiếp nhận" column={column} />,
    cell: ({ row }) => <span className="text-xs text-muted">{formatDate(row.original.submittedAt, "dd/MM/yyyy · HH:mm")}</span>,
  },
  { id: "open", header: "", enableSorting: false, cell: () => <ArrowUpRight className="ml-auto size-4 text-faint" /> },
];
