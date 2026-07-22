"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hrService } from "@/services/hr.service";
import { hrQueryKeys } from "@/services/query-keys";

export function useHrNotifications() {
  return useQuery({ queryKey: hrQueryKeys.notifications, queryFn: () => hrService.getNotifications(), refetchInterval: 30_000 });
}

export function useMarkHrNotificationRead() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => hrService.markNotificationRead(id), onSuccess: () => client.invalidateQueries({ queryKey: hrQueryKeys.notifications }) });
}

export function useMarkAllHrNotificationsRead() {
  const client = useQueryClient();
  return useMutation({ mutationFn: () => hrService.markAllNotificationsRead(), onSuccess: () => client.invalidateQueries({ queryKey: hrQueryKeys.notifications }) });
}
