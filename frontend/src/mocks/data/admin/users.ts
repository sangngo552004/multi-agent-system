import type { AdminUser, UserRole, UserStatus } from "@/types/domain/admin";

type SeedInput = [string, string, UserRole, UserStatus, number];

const rows: SeedInput[] = [
  ["Admin Nguyễn", "admin@careeros.demo", "ADMIN", "ACTIVE", 90],
  ["Trần Minh Anh", "minhanh@careeros.demo", "CANDIDATE", "ACTIVE", 2],
  ["Nguyễn Hoàng Nam", "hoangnam@careeros.demo", "CANDIDATE", "ACTIVE", 4],
  ["Lê Phương Thảo", "phuongthao@careeros.demo", "HR", "ACTIVE", 6],
  ["Phạm Quốc Bảo", "quocbao@careeros.demo", "HR", "ACTIVE", 8],
  ["Võ Gia Hân", "giahan@careeros.demo", "CANDIDATE", "ACTIVE", 3],
  ["Đỗ Thành Công", "thanhcong@careeros.demo", "CANDIDATE", "BLOCKED", 14],
  ["Bùi Ngọc Linh", "ngoclinh@careeros.demo", "HR", "ACTIVE", 11],
  ["Hoàng Đức Anh", "ducanh@careeros.demo", "CANDIDATE", "ACTIVE", 1],
  ["Ngô Hải Yến", "haiyen@careeros.demo", "HR", "ACTIVE", 5],
  ["Dương Tấn Phát", "tanphat@careeros.demo", "CANDIDATE", "ACTIVE", 7],
  ["Trương Mai Chi", "maichi@careeros.demo", "CANDIDATE", "ACTIVE", 10],
  ["Mai Tuấn Kiệt", "tuankiet@careeros.demo", "HR", "BLOCKED", 18],
  ["Đặng Khánh Vy", "khanhvy@careeros.demo", "CANDIDATE", "ACTIVE", 12],
  ["Lý Nhật Quang", "nhatquang@careeros.demo", "HR", "ACTIVE", 20],
  ["Hồ Bảo Trâm", "baotram@careeros.demo", "CANDIDATE", "ACTIVE", 9],
  ["Tạ Minh Khoa", "minhkhoa@careeros.demo", "CANDIDATE", "BLOCKED", 25],
  ["Lâm Thu Hà", "thuha@careeros.demo", "HR", "ACTIVE", 3],
  ["Phan Anh Tú", "anhtu@careeros.demo", "CANDIDATE", "ACTIVE", 15],
  ["Huỳnh Tú Uyên", "tuyen@careeros.demo", "CANDIDATE", "ACTIVE", 17],
  ["Trịnh Gia Bảo", "giabao@careeros.demo", "HR", "ACTIVE", 22],
  ["Cao Thanh Tâm", "thanhtam@careeros.demo", "CANDIDATE", "ACTIVE", 28],
];

const staffProfiles: Record<string, Pick<AdminUser, "employeeCode" | "departmentName" | "jobTitle" | "workLocation">> = {
  "admin@careeros.demo": { employeeCode: "ADM-001", departmentName: "Phòng Công nghệ thông tin", jobTitle: "Quản trị hệ thống", workLocation: "Trụ sở chính" },
  "phuongthao@careeros.demo": { employeeCode: "HR-104", departmentName: "Khối Công nghệ", jobTitle: "Chuyên viên tuyển dụng", workLocation: "TP. Hồ Chí Minh" },
  "quocbao@careeros.demo": { employeeCode: "HR-108", departmentName: "Khối Sản phẩm", jobTitle: "Chuyên viên tuyển dụng", workLocation: "Hà Nội" },
  "ngoclinh@careeros.demo": { employeeCode: "HR-112", departmentName: "Ban Nhân sự", jobTitle: "Chuyên viên nhân sự", workLocation: "Trụ sở chính" },
  "haiyen@careeros.demo": { employeeCode: "HR-119", departmentName: "Khối Trải nghiệm khách hàng", jobTitle: "Chuyên viên tuyển dụng", workLocation: "TP. Hồ Chí Minh" },
  "tuankiet@careeros.demo": { employeeCode: "HR-126", departmentName: "Khối Kinh doanh", jobTitle: "Chuyên viên tuyển dụng", workLocation: "Hà Nội" },
  "nhatquang@careeros.demo": { employeeCode: "HR-133", departmentName: "Trung tâm Công nghệ", jobTitle: "Trưởng nhóm tuyển dụng", workLocation: "Đà Nẵng" },
  "thuha@careeros.demo": { employeeCode: "HR-141", departmentName: "Khối Vận hành", jobTitle: "Chuyên viên tuyển dụng", workLocation: "Hà Nội" },
  "giabao@careeros.demo": { employeeCode: "HR-148", departmentName: "Trung tâm Dữ liệu & AI", jobTitle: "Đối tác nhân sự", workLocation: "TP. Hồ Chí Minh" },
};

export const userSeeds: AdminUser[] = rows.map(([fullName, email, role, status, daysAgo], index) => {
  const createdAt = new Date(Date.now() - (daysAgo + 45) * 86_400_000).toISOString();
  const lastActiveAt = new Date(Date.now() - (index % 8) * 3_600_000).toISOString();
  return {
    id: index === 0 ? "usr-admin-001" : `usr-${String(index + 1).padStart(3, "0")}`,
    fullName,
    email,
    role,
    status,
    ...staffProfiles[email],
    createdAt,
    lastActiveAt,
    jobsCount: role === "HR" ? (index % 5) + 1 : 0,
    applicationsCount: role === "CANDIDATE" ? (index % 6) + 1 : 0,
  };
});
