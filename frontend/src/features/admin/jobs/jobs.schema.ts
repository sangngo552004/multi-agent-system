import { z } from "zod";

export const rejectJobSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(8, "Lý do cần có ít nhất 8 ký tự.")
    .max(300, "Lý do không quá 300 ký tự."),
});

export type RejectJobForm = z.infer<typeof rejectJobSchema>;
