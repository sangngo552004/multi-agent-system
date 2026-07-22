import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, CircleAlert, CircleCheck, FileUser } from "lucide-react";
import { SortableHeader } from "@/components/data-display/data-table";
import { StatusDot } from "@/components/ui/status-dot";
import { jobStatusMap } from "@/config/status";
import type { HrJobListItem } from "@/features/hr/jobs/jobs.types";
import { formatDate } from "@/lib/format";

export const hrJobTableColumns: ColumnDef<HrJobListItem>[] = [
  { accessorKey: "title", header: ({ column }) => <SortableHeader label="Vị trí tuyển dụng" column={column} />, cell: ({ row }) => <div className="relative pl-3">{!row.original.matchingReady && row.original.status !== "CLOSED" ? <span className="absolute bottom-0 left-0 top-0 w-[3px] rounded-full bg-accent" /> : null}<p className="font-semibold text-ink">{row.original.title}</p><p className="mt-1 text-xs text-muted">{row.original.departmentName}</p></div> },
  { id: "classification", accessorFn: (row) => `${row.jobFamilyName ?? ""} ${row.careerLevelName ?? ""}`, header: "Nhóm nghề / Cấp bậc", cell: ({ row }) => <div><p className="text-sm text-ink">{row.original.jobFamilyName ?? "Chưa phân loại"}</p><p className="mt-1 text-xs text-muted">{row.original.careerLevelName ?? "Chưa có cấp bậc"}</p></div> },
  { accessorKey: "applicationCount", header: ({ column }) => <SortableHeader label="Hồ sơ" column={column} />, cell: ({ row }) => <span className="inline-flex items-center gap-1.5 text-sm text-muted"><FileUser className="size-4" /><strong className="text-ink">{row.original.applicationCount}</strong>{row.original.newApplicationCount ? <span className="text-brand">· {row.original.newApplicationCount} mới</span> : null}</span> },
  { accessorKey: "status", header: ({ column }) => <SortableHeader label="Trạng thái" column={column} />, cell: ({ row }) => { const status = jobStatusMap[row.original.status]; return <StatusDot label={status.label} tone={status.tone} />; } },
  { id: "matching", accessorFn: (row) => row.matchingReady, header: "Đối sánh AI", cell: ({ row }) => <span className="inline-flex items-center gap-1.5 text-xs text-muted">{row.original.matchingReady ? <CircleCheck className="size-4 text-success" /> : <CircleAlert className="size-4 text-warning" />}{row.original.matchingReady ? "Sẵn sàng" : "Cần hoàn thiện"}</span> },
  { accessorKey: "expiresAt", header: ({ column }) => <SortableHeader label="Hạn tuyển" column={column} />, cell: ({ row }) => <div><span className={row.original.expired ? "text-xs font-medium text-danger" : row.original.expiresSoon ? "text-xs font-medium text-warning" : "text-xs text-muted"}>{row.original.expired ? "Đã hết hạn" : formatDate(row.original.expiresAt)}</span>{row.original.expiresSoon ? <p className="mt-1 text-[10px] text-warning">Sắp đến hạn</p> : null}</div> },
  { id: "open", header: "", enableSorting: false, cell: () => <ArrowUpRight className="ml-auto size-4 text-faint" /> },
];
