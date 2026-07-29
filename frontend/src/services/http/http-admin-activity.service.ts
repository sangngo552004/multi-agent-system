"use client";

import type {
  ActivityFilters,
  ActivityListResult,
} from "@/features/admin/activity/activity.types";
import { apiRequest } from "@/services/http/api-client";
import { adminQueryString } from "@/services/http/http-admin.shared";

export const httpAdminActivityService = {
  getActivities(filters: ActivityFilters = {}) {
    return apiRequest<ActivityListResult>(
      `/api/v1/admin/activities${adminQueryString(filters)}`,
    );
  },
};
