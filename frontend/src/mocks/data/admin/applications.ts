import type {
  AdminApplication,
  AiProcessingStatus,
  RecruitmentStatus,
} from "@/types/domain/admin";

const candidateIds = [
  "usr-002", "usr-003", "usr-006", "usr-007", "usr-009", "usr-011", "usr-012",
  "usr-014", "usr-016", "usr-017", "usr-019", "usr-020", "usr-022",
];

const recruitmentStatuses: RecruitmentStatus[] = [
  "PENDING", "REVIEWING", "SHORTLISTED", "REJECTED", "REVIEWING", "PENDING", "HIRED",
];

function getAiStatus(index: number): AiProcessingStatus {
  if (index === 4 || index === 11) return "FAILED";
  if (index === 2 || index === 16) return "PROCESSING";
  if (index === 6 || index === 20) return "WAITING";
  return "COMPLETED";
}

export const applicationSeeds: AdminApplication[] = Array.from({ length: 32 }, (_, index) => {
  const aiStatus = getAiStatus(index);
  const matchScore = aiStatus === "COMPLETED" ? 56 + (index * 7) % 41 : undefined;
  const invalidFile = index === 11;
  const lowConfidence = index % 9 === 0;

  return {
    id: `app-${String(index + 1).padStart(3, "0")}`,
    candidateId: candidateIds[index % candidateIds.length],
    jobId: `job-${String(1 + (index % 12)).padStart(3, "0")}`,
    recruitmentStatus: recruitmentStatuses[index % recruitmentStatuses.length],
    aiStatus,
    submittedAt: new Date(Date.now() - (index % 29) * 86_400_000 - (index % 9) * 3_600_000).toISOString(),
    matchScore,
    aiConfidence: lowConfidence ? 0.68 : 0.89 + (index % 5) * 0.015,
    needsReview: aiStatus === "FAILED" || lowConfidence || (matchScore !== undefined && matchScore < 65),
    extractionMethod: index % 5 === 0 ? "OCR" : "TEXT_LAYER",
    errorCode: aiStatus === "FAILED" ? (invalidFile ? "INVALID_FILE" : "AI_TIMEOUT") : undefined,
    errorMessage: aiStatus === "FAILED"
      ? invalidFile
        ? "Tệp CV bị hỏng hoặc định dạng không được hỗ trợ."
        : "Tác vụ phân tích vượt quá thời gian xử lý cho phép."
      : undefined,
    canRetry: aiStatus === "FAILED" && !invalidFile,
    personalSummary: "Ứng viên có nền tảng công nghệ, từng tham gia phát triển sản phẩm số và phối hợp với nhóm đa chức năng. Định hướng tiếp theo là nâng cao năng lực chuyên môn và khả năng dẫn dắt công việc.",
    skillGroups: [
      { group: "Chuyên môn", skills: ["React", "TypeScript", "REST API", "SQL"] },
      { group: "Công cụ", skills: ["Git", "Figma", "Jira"] },
      { group: "Kỹ năng mềm", skills: ["Giao tiếp", "Giải quyết vấn đề", "Làm việc nhóm"] },
    ],
    experiences: [
      { company: "Công ty Sản phẩm Số Aster", role: "Software Developer", period: "2024 – nay", summary: "Phát triển và tối ưu các tính năng web, phối hợp cùng Product và QA trong quy trình phát hành." },
      { company: "Pixel Lab", role: "Developer Intern", period: "2023 – 2024", summary: "Xây dựng component giao diện và hỗ trợ kiểm thử tích hợp." },
    ],
    education: [
      { school: "Đại học Công nghệ Demo", program: "Kỹ thuật phần mềm", period: "2020 – 2024" },
    ],
    languages: ["Tiếng Việt · Bản ngữ", "Tiếng Anh · B2"],
    extractionWarnings: lowConfidence ? ["Một số mốc thời gian trong CV chưa rõ ràng.", "Nên đối chiếu lại số năm kinh nghiệm."] : [],
    scoreBreakdown: matchScore === undefined ? undefined : {
      hardSkills: Math.min(98, matchScore + 4),
      softSkills: Math.max(50, matchScore - 6),
      experience: Math.max(48, matchScore - 2),
    },
    matchedSkills: ["TypeScript", "React", "Git", "Giao tiếp"],
    missingSkills: ["Kiến trúc hệ thống", "Kiểm thử tự động"],
    aiRecommendation: matchScore === undefined ? undefined : matchScore >= 75
      ? "Hồ sơ phù hợp tốt. Nên ưu tiên phỏng vấn kỹ thuật và kiểm tra kinh nghiệm triển khai thực tế."
      : "Hồ sơ có nền tảng phù hợp nhưng cần làm rõ độ sâu chuyên môn ở vòng sàng lọc.",
    growthAreas: ["Thiết kế hệ thống", "Kiểm thử tự động", "Kỹ năng dẫn dắt"],
    careerPath: aiStatus === "COMPLETED" ? [
      { title: "Củng cố nền tảng", duration: "0–3 tháng", objective: "Lấp khoảng trống kỹ thuật cốt lõi.", activities: ["Hoàn thành khóa kiểm thử tự động", "Xây một dự án áp dụng kiến trúc module"] },
      { title: "Thực hành nâng cao", duration: "3–6 tháng", objective: "Áp dụng kiến thức vào bài toán thực tế.", activities: ["Đảm nhiệm một tính năng từ thiết kế đến phát hành", "Thực hiện code review định kỳ"] },
      { title: "Mở rộng vai trò", duration: "6–12 tháng", objective: "Tăng khả năng sở hữu và dẫn dắt.", activities: ["Mentor thành viên mới", "Đề xuất cải tiến kỹ thuật cho nhóm"] },
    ] : [],
  };
});
