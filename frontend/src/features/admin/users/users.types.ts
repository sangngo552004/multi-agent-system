import type { UserRole, UserStatus } from "@/types/domain/admin";

export type UserFilters = {
  search?: string;
  role?: UserRole | "ALL";
  status?: UserStatus | "ALL";
};

export type UserStatusInput = {
  userId: string;
  status: UserStatus;
  reason: string;
};
