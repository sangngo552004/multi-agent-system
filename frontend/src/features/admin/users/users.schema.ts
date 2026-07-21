import { z } from "zod";

export const userStatusReasonSchema = z.object({
  reason: z.string().trim().min(8, "Lý do cần có ít nhất 8 ký tự.").max(240, "Lý do không quá 240 ký tự."),
});

export const verificationNoteSchema = z.object({
  note: z.string().trim().min(8, "Ghi chú cần có ít nhất 8 ký tự.").max(300, "Ghi chú không quá 300 ký tự."),
});

export type UserStatusReasonForm = z.infer<typeof userStatusReasonSchema>;
export type VerificationNoteForm = z.infer<typeof verificationNoteSchema>;
