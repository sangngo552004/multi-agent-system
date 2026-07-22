"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserFilters, UserStatusInput } from "@/features/admin/users/users.types";
import { adminService } from "@/services/admin.service";
import { adminQueryKeys } from "@/services/query-keys";

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: adminQueryKeys.users(filters),
    queryFn: () => adminService.getUsers(filters),
    placeholderData: (previous) => previous,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: adminQueryKeys.user(userId),
    queryFn: () => adminService.getUser(userId),
  });
}

export function useUserActivity(userId: string) {
  return useQuery({
    queryKey: adminQueryKeys.userActivity(userId),
    queryFn: () => adminService.getUserActivity(userId),
  });
}

function useInvalidateAdminData() {
  const queryClient = useQueryClient();
  return async (userId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(userId) }),
    ]);
  };
}

export function useUpdateUserStatus() {
  const invalidate = useInvalidateAdminData();
  return useMutation({
    mutationFn: (input: UserStatusInput) => adminService.updateUserStatus(input),
    onSuccess: (user) => invalidate(user.id),
  });
}
