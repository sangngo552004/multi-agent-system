"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { adminQueryKeys } from "@/services/query-keys";
import type { ActivityFilters } from "@/features/admin/activity/activity.types";

export function useActivities(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: adminQueryKeys.activities(filters),
    queryFn: () => adminService.getActivities(filters),
    placeholderData: (previous) => previous,
  });
}
