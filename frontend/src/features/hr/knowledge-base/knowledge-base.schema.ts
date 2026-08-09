import { z } from "zod";

const requiredText = (label: string, minimum = 2) => z.string().trim().min(minimum, `${label} cần ít nhất ${minimum} ký tự.`).max(500, `${label} quá dài.`);

export const competencySchema = z.object({
  name: requiredText("Tên kỹ năng"),
  description: requiredText("Mô tả", 5),
  category: requiredText("Danh mục"),
});

export type CompetencyFormValues = z.infer<typeof competencySchema>;

export const jobFamilySchema = z.object({
  name: requiredText("Tên nhóm nghề"),
  description: requiredText("Mô tả", 5),
});

export type JobFamilyFormValues = z.infer<typeof jobFamilySchema>;

export const careerLevelSchema = z.object({
  name: requiredText("Tên cấp bậc"),
  description: requiredText("Mô tả", 5),
  rankValue: z.number().int().min(1, "Thứ bậc tối thiểu là 1").max(100, "Thứ bậc quá cao"),
});

export type CareerLevelFormValues = z.infer<typeof careerLevelSchema>;

export const institutionalRuleSchema = z.object({
  ruleCode: requiredText("Mã quy tắc").regex(/^[A-Z0-9_]+$/, "Mã chỉ được chứa chữ in hoa, số và dấu gạch dưới"),
  name: requiredText("Tên quy tắc"),
  description: requiredText("Mô tả", 5),
  bonusPoints: z.number().min(0, "Điểm cộng không được âm").max(100, "Điểm cộng tối đa là 100"),
  maxImpactPercent: z.number().min(0, "Phần trăm ảnh hưởng không được âm").max(100, "Phần trăm tối đa là 100"),
  appliesToDomain: requiredText("Lĩnh vực áp dụng"),
  pedigreeGroupId: z.string().uuid("Hãy chọn nhóm đối chiếu"),
  jobFamilyIds: z.array(z.string()).default([]),
});

export type InstitutionalRuleFormValues = z.infer<typeof institutionalRuleSchema>;
