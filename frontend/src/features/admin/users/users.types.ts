import type { HrVerificationStatus, UserRole, UserStatus } from "@/types/domain/admin";

export type UserFilters = {
  search?: string;
  role?: UserRole | "ALL";
  status?: UserStatus | "ALL";
  verificationStatus?: HrVerificationStatus | "ALL";
};

export type UserStatusInput = {
  userId: string;
  status: UserStatus;
  reason: string;
};

export type VerificationDecision = "VERIFIED" | "CHANGES_REQUESTED" | "REJECTED";

export type VerificationInput = {
  userId: string;
  decision: VerificationDecision;
  note: string;
};
