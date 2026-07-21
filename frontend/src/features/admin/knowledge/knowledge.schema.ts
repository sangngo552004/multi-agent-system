import { z } from "zod";

const text = (label: string) => z.string().trim().min(2, `${label} cần ít nhất 2 ký tự.`).max(180, `${label} quá dài.`);

export const jobFamilySchema = z.object({ name: text("Tên nhóm nghề"), description: text("Mô tả") });
export const careerLevelSchema = jobFamilySchema.extend({ rankValue: z.coerce.number().int().min(1).max(20) });
export const competencySchema = z.object({ name: text("Tên năng lực"), category: text("Nhóm năng lực"), description: text("Mô tả") });
export const competencyLevelsSchema = z.object({
  levels: z.array(z.object({ level: z.number().int().min(1).max(5), title: text("Tên cấp độ"), description: text("Mô tả cấp độ") })).length(5),
});

export type JobFamilyForm = z.infer<typeof jobFamilySchema>;
export type CareerLevelForm = z.infer<typeof careerLevelSchema>;
export type CompetencyForm = z.infer<typeof competencySchema>;
export type CompetencyLevelsForm = z.infer<typeof competencyLevelsSchema>;
