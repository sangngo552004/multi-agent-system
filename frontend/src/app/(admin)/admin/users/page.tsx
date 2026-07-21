import type { Metadata } from "next";
import { Suspense } from "react";
import { UsersTableSkeleton } from "@/features/admin/users/components/users-table-skeleton";
import { UsersPage } from "@/features/admin/users/components/users-page";

export const metadata: Metadata = { title: "Người dùng" };

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="overflow-hidden rounded-[12px] border border-border bg-surface"><UsersTableSkeleton /></div>}>
      <UsersPage />
    </Suspense>
  );
}
