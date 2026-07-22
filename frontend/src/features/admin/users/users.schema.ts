import { z } from "zod";

export const userStatusReasonSchema = z.object({
  reason: z.string().trim().min(8, "Lý do cần có ít nhất 8 ký tự.").max(240, "Lý do không quá 240 ký tự."),
});

export type UserStatusReasonForm = z.infer<typeof userStatusReasonSchema>;
