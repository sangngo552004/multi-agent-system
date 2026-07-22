import { z } from "zod";

export const talentPoolFormSchema = z.object({
  labelsText: z.string().trim().max(160, "Nhãn tối đa 160 ký tự."),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự."),
  retentionUntil: z.string().min(1, "Hãy chọn hạn lưu dữ liệu."),
});

export type TalentPoolFormValues = z.infer<typeof talentPoolFormSchema>;

export function parseTalentLabels(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 6);
}
