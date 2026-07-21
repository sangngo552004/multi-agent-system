"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardRange } from "@/features/admin/dashboard/dashboard.types";
import { adminService } from "@/services/admin.service";
import { adminQueryKeys } from "@/services/query-keys";

export function useDashboard(range: DashboardRange) {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(range),
    queryFn: () => adminService.getDashboard(range),
  });
}
