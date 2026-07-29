"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-display/data-table";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminQueryError } from "@/features/admin/components/admin-query-error";
import { userTableColumns } from "@/features/admin/users/components/user-table-columns";
import { UsersTableSkeleton } from "@/features/admin/users/components/users-table-skeleton";
import { useUsers } from "@/features/admin/users/users.queries";
import type { UserFilters } from "@/features/admin/users/users.types";
import { useDebounce } from "@/hooks/use-debounce";
import type { UserRole, UserStatus } from "@/types/domain/admin";
import type { SortingState } from "@tanstack/react-table";
import {
  readEnumParam,
  readPageIndex,
  readSorting,
} from "@/features/admin/admin-search-params";

const roleOptions = [
  { value: "ALL", label: "Tất cả vai trò" },
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "HR", label: "Nhân sự tuyển dụng" },
  { value: "CANDIDATE", label: "Ứng viên" },
];
const statusOptions = [
  { value: "ALL", label: "Mọi trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "BLOCKED", label: "Đã khóa" },
];
const userRoles = ["ALL", "ADMIN", "HR", "CANDIDATE"] as const;
const userStatuses = ["ALL", "ACTIVE", "BLOCKED"] as const;
const userSortFields = ["fullName", "role", "lastActiveAt", "createdAt"] as const;

export function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [role, setRole] = useState<UserRole | "ALL">(() =>
    readEnumParam(searchParams.get("role"), userRoles, "ALL"),
  );
  const [status, setStatus] = useState<UserStatus | "ALL">(() =>
    readEnumParam(searchParams.get("status"), userStatuses, "ALL"),
  );
  const [page, setPage] = useState(() =>
    readPageIndex(searchParams.get("page")),
  );
  const [sorting, setSorting] = useState<SortingState>(() =>
    readSorting(searchParams.get("sort"), userSortFields, "createdAt"),
  );
  const debouncedSearch = useDebounce(search);
  const filters = useMemo<UserFilters>(
    () => ({
      search: debouncedSearch,
      role,
      status,
      page,
      size: 20,
      sort: sorting[0]
        ? `${sorting[0].id},${sorting[0].desc ? "desc" : "asc"}`
        : "createdAt,desc",
    }),
    [debouncedSearch, page, role, sorting, status],
  );
  const users = useUsers(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (role !== "ALL") params.set("role", role);
    if (status !== "ALL") params.set("status", status);
    if (page > 0) params.set("page", String(page + 1));
    if (sorting[0]) params.set("sort", `${sorting[0].id},${sorting[0].desc ? "desc" : "asc"}`);
    const query = params.toString();
    router.replace(query ? `/admin/users?${query}` : "/admin/users", { scroll: false });
  }, [debouncedSearch, page, role, router, sorting, status]);

  const clearFilters = () => {
    setSearch("");
    setRole("ALL");
    setStatus("ALL");
    setPage(0);
  };

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Quản trị truy cập" title="Tài khoản" description="Theo dõi tài khoản nội bộ và ứng viên, kiểm soát trạng thái truy cập của hệ thống." />
      <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Tìm theo tên hoặc email..." className="w-full xl:max-w-sm" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 hidden items-center gap-2 text-xs font-medium text-muted sm:flex"><SlidersHorizontal className="size-4" /> Bộ lọc</span>
              <Select label="Vai trò" value={role} onValueChange={(value) => { setRole(value as UserRole | "ALL"); setPage(0); }} options={roleOptions} />
              <Select label="Trạng thái tài khoản" value={status} onValueChange={(value) => { setStatus(value as UserStatus | "ALL"); setPage(0); }} options={statusOptions} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
            <p className="flex items-center gap-2 text-xs text-muted"><UsersRound className="size-4" /><span><strong className="font-semibold text-ink">{users.data?.totalItems ?? 0}</strong> tài khoản phù hợp</span>{users.isFetching && !users.isPending ? <span className="text-faint">· đang cập nhật</span> : null}</p>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-brand hover:underline">Xóa bộ lọc</button>
          </div>
        </div>
        {users.isPending ? <div className="overflow-hidden"><UsersTableSkeleton /></div> : null}
        {users.isError ? (
          <div className="p-5">
            <AdminQueryError
              error={users.error}
              fallbackDescription="Chưa thể tải danh sách tài khoản lúc này."
              onRetry={() => users.refetch()}
              retrying={users.isFetching}
            />
          </div>
        ) : null}
        {users.data ? <DataTable columns={userTableColumns} data={users.data.items} getRowId={(user) => user.id} onRowClick={(user) => router.push(`/admin/users/${user.id}`)} server={{ pageIndex: users.data.page, pageSize: users.data.size, pageCount: users.data.totalPages, totalItems: users.data.totalItems, onPageChange: setPage, sorting, onSortingChange: (updater) => { setSorting((current) => typeof updater === "function" ? updater(current) : updater); setPage(0); } }} /> : null}
      </section>
    </div>
  );
}
