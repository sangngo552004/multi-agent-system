"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { adminQueryKeys } from "@/services/query-keys";

export function useActivities() {
  return useQuery({ queryKey: adminQueryKeys.activities, queryFn: () => adminService.getActivities() });
}
