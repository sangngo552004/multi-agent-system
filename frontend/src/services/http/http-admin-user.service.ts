"use client";

import type { ActivityListResult } from "@/features/admin/activity/activity.types";
import type {
  UserFilters,
  UserListResult,
  UserStatusInput,
} from "@/features/admin/users/users.types";
import { apiRequest } from "@/services/http/api-client";
import { adminQueryString } from "@/services/http/http-admin.shared";
import type { AdminUser } from "@/types/domain/admin";

export const httpAdminUserService = {
  getUsers(filters: UserFilters = {}) {
    return apiRequest<UserListResult>(
      `/api/v1/admin/users${adminQueryString(filters)}`,
    );
  },

  getUser(userId: string) {
    return apiRequest<AdminUser>(`/api/v1/admin/users/${userId}`);
  },

  async getUserActivity(userId: string) {
    const result = await apiRequest<ActivityListResult>(
      `/api/v1/admin/activities${adminQueryString({
        targetType: "USER",
        targetId: userId,
        page: 0,
        size: 50,
      })}`,
    );
    return result.items;
  },

  updateUserStatus(input: UserStatusInput) {
    return apiRequest<AdminUser>(
      `/api/v1/admin/users/${input.userId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: input.status,
          reason: input.reason,
        }),
      },
    );
  },
};
