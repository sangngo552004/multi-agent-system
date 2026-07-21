"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data-display/empty-state";
import { cn } from "@/lib/cn";

export function SortableHeader({ label, column }: { label: string; column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void } }) {
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="inline-flex items-center gap-1.5 whitespace-nowrap font-sans text-xs font-semibold normal-case tracking-normal text-[#4f5c54] hover:text-ink"
      aria-label={`Sắp xếp theo ${label}`}
    >
      {label}<Icon className="size-3.5 text-muted" />
    </button>
  );
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  onRowClick,
  rowClassName,
  emptyTitle = "Không có dữ liệu phù hợp",
  emptyDescription = "Thử thay đổi từ khóa hoặc bộ lọc đang dùng.",
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  // TanStack Table exposes mutable callbacks by design; React Compiler safely skips this boundary.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data,
    getRowId,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-border bg-surface-soft/55">
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-sans text-xs font-semibold normal-case tracking-normal text-[#4f5c54] first:pl-5 last:pr-5">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                onKeyDown={(event) => {
                  if (!onRowClick || (event.key !== "Enter" && event.key !== " ")) return;
                  event.preventDefault();
                  onRowClick(row.original);
                }}
                role={onRowClick ? "link" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "border-b border-border/80 bg-surface transition-colors last:border-0",
                  onRowClick && "cursor-pointer hover:bg-[#fafbf8] focus-visible:bg-[#fafbf8] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                  rowClassName?.(row.original),
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4 text-sm first:pl-5 last:pr-5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Hiển thị <span className="font-medium text-ink">{table.getRowModel().rows.length}</span> / {data.length} kết quả
        </p>
        <div className="flex items-center gap-2">
          <span className="mr-2 text-xs text-muted">Trang {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}</span>
          <Button size="icon" variant="secondary" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Trang trước"><ChevronLeft className="size-4" /></Button>
          <Button size="icon" variant="secondary" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Trang sau"><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}
