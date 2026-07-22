import { z } from "zod";

export const hrApplicationNoteSchema = z.object({
  content: z.string().trim().min(3, "Ghi chú cần có ít nhất 3 ký tự.").max(500, "Ghi chú tối đa 500 ký tự."),
});

export type HrApplicationNoteValues = z.infer<typeof hrApplicationNoteSchema>;
