import type {
  AdminJob,
  EmploymentType,
  JobCompetencyRequirement,
  JobStatus,
} from "@/types/domain/admin";

type JobDefinition = {
  id: string;
  title: string;
  departmentName: string;
  ownerId: string;
  status: JobStatus;
  daysAgo: number;
  expiresIn: number;
  location: string;
  employmentType: EmploymentType;
  openingsCount?: number;
  family?: [string, string];
  level?: [string, string];
  competencies?: JobCompetencyRequirement[];
};

const competency = (
  competencyId: string,
  name: string,
  requiredLevel: number,
  weight: number,
  mandatory = false,
): JobCompetencyRequirement => ({ competencyId, name, requiredLevel, weight, mandatory });

const definitions: JobDefinition[] = [
  {
    id: "job-001", title: "Frontend Developer", departmentName: "Khối Công nghệ", ownerId: "usr-004",
    status: "DRAFT", daysAgo: 1, expiresIn: 29,
    location: "TP. Hồ Chí Minh · Hybrid", employmentType: "FULL_TIME",
    family: ["software-engineering", "Kỹ thuật phần mềm"], level: ["middle", "Middle"],
    competencies: [competency("comp-001", "Phát triển giao diện", 3, 45, true), competency("comp-006", "Tư duy giải quyết vấn đề", 3, 30, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 2, 25)],
  },
  {
    id: "job-002", title: "Product Designer", departmentName: "Khối Sản phẩm", ownerId: "usr-005",
    status: "OPEN", daysAgo: 5, expiresIn: 25,
    location: "Hà Nội · Tại văn phòng", employmentType: "FULL_TIME",
    family: ["product-design", "Sản phẩm & Thiết kế"], level: ["middle", "Middle"],
    competencies: [competency("comp-003", "Thiết kế trải nghiệm", 3, 55, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 3, 25), competency("comp-006", "Tư duy giải quyết vấn đề", 3, 20)],
  },
  {
    id: "job-003", title: "Data Analyst", departmentName: "Khối Sản phẩm", ownerId: "usr-005",
    status: "OPEN", daysAgo: 8, expiresIn: 22,
    location: "Hà Nội · Hybrid", employmentType: "FULL_TIME",
    family: ["data-analytics", "Dữ liệu & Phân tích"], level: ["junior", "Junior"],
    competencies: [competency("comp-002", "Phân tích dữ liệu", 3, 60, true), competency("comp-006", "Tư duy giải quyết vấn đề", 3, 40, true)],
  },
  {
    id: "job-004", title: "Backend Engineer", departmentName: "Trung tâm Công nghệ", ownerId: "usr-015",
    status: "DRAFT", daysAgo: 2, expiresIn: 28,
    location: "Đà Nẵng · Remote", employmentType: "FULL_TIME",
    family: ["software-engineering", "Kỹ thuật phần mềm"], level: ["senior", "Senior"], competencies: [],
  },
  {
    id: "job-005", title: "Talent Acquisition Intern", departmentName: "Khối Vận hành", ownerId: "usr-018",
    status: "CLOSED", daysAgo: 46, expiresIn: -4,
    location: "TP. Hồ Chí Minh", employmentType: "INTERNSHIP",
    family: ["people-operations", "Nhân sự & Vận hành"], level: ["intern", "Thực tập sinh"],
    competencies: [competency("comp-004", "Quản lý tuyển dụng", 1, 55, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 2, 45, true)],
  },
  {
    id: "job-006", title: "QA Engineer", departmentName: "Trung tâm Dữ liệu & AI", ownerId: "usr-021",
    status: "OPEN", daysAgo: 12, expiresIn: 18,
    location: "TP. Hồ Chí Minh · Hybrid", employmentType: "FULL_TIME",
    family: ["software-engineering", "Kỹ thuật phần mềm"], level: ["middle", "Middle"],
    competencies: [competency("comp-006", "Tư duy giải quyết vấn đề", 4, 50, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 3, 20), competency("comp-qa", "Kiểm thử phần mềm", 3, 30, true)],
  },
  {
    id: "job-007", title: "Business Analyst", departmentName: "Khối Sản phẩm", ownerId: "usr-005",
    status: "PAUSED", daysAgo: 16, expiresIn: 14,
    location: "Hà Nội", employmentType: "FULL_TIME",
    family: ["data-analytics", "Dữ liệu & Phân tích"], level: ["middle", "Middle"],
    competencies: [competency("comp-006", "Tư duy giải quyết vấn đề", 4, 45, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 4, 35, true), competency("comp-ba", "Phân tích nghiệp vụ", 3, 20)],
  },
  {
    id: "job-008", title: "UX Researcher", departmentName: "Khối Trải nghiệm khách hàng", ownerId: "usr-010",
    status: "DRAFT", daysAgo: 3, expiresIn: 27,
    location: "TP. Hồ Chí Minh", employmentType: "CONTRACT",
    family: ["product-design", "Sản phẩm & Thiết kế"], level: ["middle", "Middle"],
    competencies: [competency("comp-003", "Thiết kế trải nghiệm", 3, 50, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 4, 30, true), competency("comp-006", "Tư duy giải quyết vấn đề", 3, 20)],
  },
  {
    id: "job-009", title: "Mobile Developer", departmentName: "Trung tâm Công nghệ", ownerId: "usr-015",
    status: "OPEN", daysAgo: 19, expiresIn: 11,
    location: "Đà Nẵng · Remote", employmentType: "FULL_TIME",
    family: ["software-engineering", "Kỹ thuật phần mềm"], level: ["senior", "Senior"],
    competencies: [competency("comp-mobile", "Phát triển ứng dụng di động", 4, 55, true), competency("comp-006", "Tư duy giải quyết vấn đề", 4, 30, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 3, 15)],
  },
  {
    id: "job-010", title: "Content Strategist", departmentName: "Khối Trải nghiệm khách hàng", ownerId: "usr-010",
    status: "CLOSED", daysAgo: 52, expiresIn: -12,
    location: "TP. Hồ Chí Minh · Hybrid", employmentType: "PART_TIME",
    family: ["marketing-content", "Marketing & Nội dung"], level: ["senior", "Senior"],
    competencies: [competency("comp-content", "Chiến lược nội dung", 4, 60, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 4, 40, true)],
  },
  {
    id: "job-011", title: "AI Engineer Intern", departmentName: "Trung tâm Dữ liệu & AI", ownerId: "usr-021",
    status: "OPEN", daysAgo: 7, expiresIn: 23,
    location: "Hà Nội · Hybrid", employmentType: "INTERNSHIP",
    family: ["data-analytics", "Dữ liệu & Phân tích"], level: ["intern", "Thực tập sinh"],
    competencies: [competency("comp-002", "Phân tích dữ liệu", 2, 45, true), competency("comp-ai", "Machine Learning", 2, 40, true), competency("comp-006", "Tư duy giải quyết vấn đề", 2, 15)],
  },
  {
    id: "job-012", title: "Operations Executive", departmentName: "Khối Vận hành", ownerId: "usr-018",
    status: "PAUSED", daysAgo: 9, expiresIn: 21,
    location: "Hà Nội", employmentType: "FULL_TIME",
    family: ["people-operations", "Nhân sự & Vận hành"], level: ["junior", "Junior"],
    competencies: [competency("comp-ops", "Điều phối vận hành", 3, 45, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 3, 35, true), competency("comp-006", "Tư duy giải quyết vấn đề", 3, 20)],
  },
  {
    id: "job-013", title: "Product Operations Specialist", departmentName: "Khối Sản phẩm", ownerId: "usr-005",
    status: "DRAFT", daysAgo: 1, expiresIn: 28,
    location: "Hà Nội · Hybrid", employmentType: "FULL_TIME",
    family: ["product-design", "Sản phẩm & Thiết kế"], level: ["junior", "Junior"], competencies: [],
  },
  {
    id: "job-014", title: "Product Marketing Specialist", departmentName: "Khối Sản phẩm", ownerId: "usr-005",
    status: "OPEN", daysAgo: 18, expiresIn: 5,
    location: "Hà Nội · Hybrid", employmentType: "FULL_TIME",
    family: ["marketing-content", "Marketing & Nội dung"], level: ["middle", "Middle"],
    competencies: [competency("comp-content", "Chiến lược nội dung", 3, 50, true), competency("comp-005", "Giao tiếp chuyên nghiệp", 3, 30, true), competency("comp-006", "Tư duy giải quyết vấn đề", 3, 20)],
  },
];

const sharedRequirements = [
  "Có kinh nghiệm hoặc dự án thực tế phù hợp với vị trí tuyển dụng.",
  "Chủ động phối hợp, trao đổi rõ ràng và chịu trách nhiệm với kết quả công việc.",
  "Có tư duy học hỏi và khả năng giải quyết vấn đề trong môi trường thay đổi.",
];

export const jobSeeds: AdminJob[] = definitions.map((job) => ({
  id: job.id,
  title: job.title,
  departmentName: job.departmentName,
  ownerId: job.ownerId,
  status: job.status,
  location: job.location,
  employmentType: job.employmentType,
  openingsCount: job.openingsCount ?? 1,
  description: `Đơn vị ${job.departmentName} đang tìm kiếm ${job.title} để bổ sung cho kế hoạch nhân sự. Ứng viên sẽ tham gia trực tiếp vào các bài toán thực tế, phối hợp cùng nhiều vai trò và có không gian đề xuất giải pháp của riêng mình.`,
  requirements: sharedRequirements,
  benefits: ["Lộ trình phát triển rõ ràng cùng mentor chuyên môn.", "Môi trường linh hoạt, khuyến khích thử nghiệm và chia sẻ.", "Gói phúc lợi và ngày nghỉ theo chính sách của tổ chức."],
  jobFamilyId: job.family?.[0],
  jobFamilyName: job.family?.[1],
  careerLevelId: job.level?.[0],
  careerLevelName: job.level?.[1],
  competencies: job.competencies ?? [],
  createdAt: new Date(Date.now() - job.daysAgo * 86_400_000).toISOString(),
  expiresAt: new Date(Date.now() + job.expiresIn * 86_400_000).toISOString(),
}));
