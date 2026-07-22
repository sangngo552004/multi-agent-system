"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-display/data-table";
import { ErrorState } from "@/components/data-display/error-state";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { userTableColumns } from "@/features/admin/users/components/user-table-columns";
import { UsersTableSkeleton } from "@/features/admin/users/components/users-table-skeleton";
import { useUsers } from "@/features/admin/users/users.queries";
import type { UserFilters } from "@/features/admin/users/users.types";
import { useDebounce } from "@/hooks/use-debounce";
import type { UserRole, UserStatus } from "@/types/domain/admin";

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
export function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [role, setRole] = useState<UserRole | "ALL">((searchParams.get("role") as UserRole) ?? "ALL");
  const [status, setStatus] = useState<UserStatus | "ALL">((searchParams.get("status") as UserStatus) ?? "ALL");
  const debouncedSearch = useDebounce(search);
  const filters = useMemo<UserFilters>(() => ({ search: debouncedSearch, role, status }), [debouncedSearch, role, status]);
  const users = useUsers(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (role !== "ALL") params.set("role", role);
    if (status !== "ALL") params.set("status", status);
    const query = params.toString();
    router.replace(query ? `/admin/users?${query}` : "/admin/users", { scroll: false });
  }, [debouncedSearch, role, router, status]);

  const clearFilters = () => {
    setSearch("");
    setRole("ALL");
    setStatus("ALL");
  };

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Quản trị truy cập" title="Tài khoản" description="Theo dõi tài khoản nội bộ và ứng viên, kiểm soát trạng thái truy cập của hệ thống." />
      <section className="overflow-hidden rounded-[12px] border border-border bg-surface">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc email..." className="w-full xl:max-w-sm" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 hidden items-center gap-2 text-xs font-medium text-muted sm:flex"><SlidersHorizontal className="size-4" /> Bộ lọc</span>
              <Select label="Vai trò" value={role} onValueChange={(value) => setRole(value as UserRole | "ALL")} options={roleOptions} />
              <Select label="Trạng thái tài khoản" value={status} onValueChange={(value) => setStatus(value as UserStatus | "ALL")} options={statusOptions} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
            <p className="flex items-center gap-2 text-xs text-muted"><UsersRound className="size-4" /><span><strong className="font-semibold text-ink">{users.data?.length ?? 0}</strong> tài khoản phù hợp</span>{users.isFetching && !users.isPending ? <span className="text-faint">· đang cập nhật</span> : null}</p>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-brand hover:underline">Xóa bộ lọc</button>
          </div>
        </div>
        {users.isPending ? <div className="overflow-hidden"><UsersTableSkeleton /></div> : null}
        {users.isError ? <div className="p-5"><ErrorState description={users.error.message} onRetry={() => users.refetch()} /></div> : null}
        {users.data ? <DataTable columns={userTableColumns} data={users.data} getRowId={(user) => user.id} onRowClick={(user) => router.push(`/admin/users/${user.id}`)} /> : null}
      </section>
    </div>
  );
}
