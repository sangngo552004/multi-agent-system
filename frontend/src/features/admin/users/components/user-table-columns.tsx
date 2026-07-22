import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { SortableHeader } from "@/components/data-display/data-table";
import { roleMap, userStatusMap } from "@/config/status";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/format";
import type { AdminUser } from "@/types/domain/admin";

export const userTableColumns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => <SortableHeader label="Người dùng" column={column} />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-surface-soft text-[11px] font-semibold text-brand">
          {getInitials(row.original.fullName)}
        </span>
        <span>
          <span className="block font-semibold text-ink">{row.original.fullName}</span>
          <span className="mt-0.5 block text-xs text-muted">{row.original.email}</span>
        </span>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => <SortableHeader label="Vai trò" column={column} />,
    cell: ({ row }) => <span className="text-sm text-muted">{roleMap[row.original.role]}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader label="Trạng thái tài khoản" column={column} />,
    cell: ({ row }) => {
      const status = userStatusMap[row.original.status];
      return <StatusDot label={status.label} tone={status.tone} />;
    },
  },
  {
    accessorKey: "departmentName",
    header: "Đơn vị công tác",
    cell: ({ row }) => {
      if (row.original.role === "CANDIDATE") return <span className="text-xs text-faint">Ứng viên bên ngoài</span>;
      return <span className="text-sm text-muted">{row.original.departmentName ?? "Chưa cập nhật"}</span>;
    },
  },
  {
    accessorKey: "lastActiveAt",
    header: ({ column }) => <SortableHeader label="Hoạt động gần nhất" column={column} />,
    cell: ({ row }) => (
      <span className="text-xs text-muted" title={formatDate(row.original.lastActiveAt, "HH:mm dd/MM/yyyy")}>
        {formatRelativeTime(row.original.lastActiveAt)}
      </span>
    ),
  },
  {
    id: "open",
    enableSorting: false,
    header: "",
    cell: () => <ArrowUpRight className="ml-auto size-4 text-faint" />,
  },
];
