"use client";

import { useQuery } from "@tanstack/react-query";
import type { HrDashboardRange } from "@/features/hr/dashboard/dashboard.types";
import { hrService } from "@/services/hr.service";
import { hrQueryKeys } from "@/services/query-keys";

export function useHrProfile() {
  return useQuery({ queryKey: hrQueryKeys.profile, queryFn: () => hrService.getCurrentHr() });
}

export function useHrDashboard(range: HrDashboardRange) {
  return useQuery({
    queryKey: hrQueryKeys.dashboard(range),
    queryFn: () => hrService.getDashboard(range),
  });
}
