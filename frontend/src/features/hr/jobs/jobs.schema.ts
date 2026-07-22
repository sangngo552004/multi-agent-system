import { z } from "zod";

const requiredText = (label: string, minimum = 2) => z.string().trim().min(minimum, `${label} cần ít nhất ${minimum} ký tự.`).max(3000, `${label} quá dài.`);

export const hrJobFormSchema = z.object({
  title: requiredText("Tên vị trí"),
  departmentName: requiredText("Đơn vị"),
  location: requiredText("Địa điểm"),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]),
  openingsCount: z.number().int().min(1, "Số lượng tuyển tối thiểu là 1.").max(100, "Số lượng tuyển quá lớn."),
  expiresAt: z.string().min(1, "Hãy chọn hạn nhận hồ sơ."),
  description: requiredText("Mô tả công việc", 20),
  requirementsText: requiredText("Yêu cầu ứng viên", 10),
  benefitsText: requiredText("Quyền lợi", 10),
  jobFamilyId: z.string(),
  careerLevelId: z.string(),
  competencies: z.array(z.object({
    competencyId: z.string().min(1),
    name: z.string().min(1),
    requiredLevel: z.number().int().min(1).max(5),
    weight: z.number().min(1).max(100),
    mandatory: z.boolean(),
  })),
}).superRefine((value, context) => {
  const ids = value.competencies.map((item) => item.competencyId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: "custom", path: ["competencies"], message: "Không được chọn trùng năng lực." });
  }
});

export type HrJobFormValues = z.infer<typeof hrJobFormSchema>;
