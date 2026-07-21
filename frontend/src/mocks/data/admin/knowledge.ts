import type { CareerLevel, Competency, JobFamily } from "@/types/domain/admin";

export const jobFamilySeeds: JobFamily[] = [
  { id: "software-engineering", name: "Kỹ thuật phần mềm", description: "Phát triển, kiểm thử và vận hành sản phẩm phần mềm.", status: "ACTIVE" },
  { id: "data-analytics", name: "Dữ liệu & Phân tích", description: "Thu thập, phân tích dữ liệu và xây dựng mô hình.", status: "ACTIVE" },
  { id: "product-design", name: "Sản phẩm & Thiết kế", description: "Nghiên cứu, thiết kế và phát triển trải nghiệm sản phẩm.", status: "ACTIVE" },
  { id: "people-operations", name: "Nhân sự & Vận hành", description: "Quản trị con người và hoạt động nội bộ.", status: "ACTIVE" },
  { id: "marketing-content", name: "Marketing & Nội dung", description: "Xây dựng thương hiệu, nội dung và tăng trưởng.", status: "ACTIVE" },
];

export const careerLevelSeeds: CareerLevel[] = [
  { id: "intern", name: "Thực tập sinh", rankValue: 1, description: "Học việc với hướng dẫn thường xuyên.", status: "ACTIVE" },
  { id: "junior", name: "Junior", rankValue: 2, description: "Thực hiện nhiệm vụ rõ phạm vi với hỗ trợ.", status: "ACTIVE" },
  { id: "middle", name: "Middle", rankValue: 3, description: "Làm việc độc lập và sở hữu một phần sản phẩm.", status: "ACTIVE" },
  { id: "senior", name: "Senior", rankValue: 4, description: "Giải quyết bài toán phức tạp và hỗ trợ thành viên khác.", status: "ACTIVE" },
  { id: "lead", name: "Lead / Manager", rankValue: 5, description: "Định hướng chuyên môn và dẫn dắt đội ngũ.", status: "ACTIVE" },
];

const levelTitles = ["Cơ bản", "Thực hành", "Độc lập", "Thành thạo", "Chuyên gia"];
const makeLevels = (name: string, complete = true) => levelTitles.map((title, index) => ({
  level: index + 1,
  title,
  description: !complete && index > 2 ? "" : `${title}: vận dụng ${name.toLowerCase()} ở mức ${index + 1}, với phạm vi và độ phức tạp tăng dần.`,
}));

export const competencySeeds: Competency[] = [
  ["comp-001", "Phát triển giao diện", "Công nghệ", true],
  ["comp-002", "Phân tích dữ liệu", "Dữ liệu", true],
  ["comp-003", "Thiết kế trải nghiệm", "Sản phẩm", true],
  ["comp-004", "Quản lý tuyển dụng", "Nhân sự", false],
  ["comp-005", "Giao tiếp chuyên nghiệp", "Năng lực chung", true],
  ["comp-006", "Tư duy giải quyết vấn đề", "Năng lực chung", true],
  ["comp-qa", "Kiểm thử phần mềm", "Công nghệ", true],
  ["comp-ba", "Phân tích nghiệp vụ", "Sản phẩm", false],
  ["comp-mobile", "Phát triển ứng dụng di động", "Công nghệ", true],
  ["comp-content", "Chiến lược nội dung", "Marketing", true],
  ["comp-ai", "Machine Learning", "Dữ liệu", false],
  ["comp-ops", "Điều phối vận hành", "Vận hành", true],
].map(([id, name, category, complete]) => ({
  id: id as string,
  name: name as string,
  category: category as string,
  description: `Khả năng áp dụng ${String(name).toLowerCase()} hiệu quả trong bối cảnh công việc thực tế.`,
  status: "ACTIVE" as const,
  levels: makeLevels(name as string, complete as boolean),
}));
