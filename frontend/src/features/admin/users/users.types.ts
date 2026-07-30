import type { UserRole, UserStatus } from "@/types/domain/admin";

export type UserFilters = {
  search?: string;
  role?: UserRole | "ALL";
  status?: UserStatus | "ALL";
  page?: number;
  size?: number;
  sort?: string;
};

export type UserListResult = {
  items: import("@/types/domain/admin").AdminUser[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type UserStatusInput = {
  userId: string;
  status: UserStatus;
  reason: string;
};
