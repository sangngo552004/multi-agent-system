import type { UserRole } from "@/types/domain/admin";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};
