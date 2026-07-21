import type { AdminUser, HrVerificationStatus, UserRole, UserStatus } from "@/types/domain/admin";

type SeedInput = [string, string, UserRole, UserStatus, HrVerificationStatus, number];

const rows: SeedInput[] = [
  ["Admin Nguyễn", "admin@careeros.demo", "ADMIN", "ACTIVE", "NOT_REQUIRED", 90],
  ["Trần Minh Anh", "minhanh@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 2],
  ["Nguyễn Hoàng Nam", "hoangnam@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 4],
  ["Lê Phương Thảo", "phuongthao@careeros.demo", "HR", "ACTIVE", "PENDING", 6],
  ["Phạm Quốc Bảo", "quocbao@careeros.demo", "HR", "ACTIVE", "VERIFIED", 8],
  ["Võ Gia Hân", "giahan@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 3],
  ["Đỗ Thành Công", "thanhcong@careeros.demo", "CANDIDATE", "BLOCKED", "NOT_REQUIRED", 14],
  ["Bùi Ngọc Linh", "ngoclinh@careeros.demo", "HR", "ACTIVE", "CHANGES_REQUESTED", 11],
  ["Hoàng Đức Anh", "ducanh@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 1],
  ["Ngô Hải Yến", "haiyen@careeros.demo", "HR", "ACTIVE", "PENDING", 5],
  ["Dương Tấn Phát", "tanphat@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 7],
  ["Trương Mai Chi", "maichi@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 10],
  ["Mai Tuấn Kiệt", "tuankiet@careeros.demo", "HR", "BLOCKED", "REJECTED", 18],
  ["Đặng Khánh Vy", "khanhvy@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 12],
  ["Lý Nhật Quang", "nhatquang@careeros.demo", "HR", "ACTIVE", "VERIFIED", 20],
  ["Hồ Bảo Trâm", "baotram@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 9],
  ["Tạ Minh Khoa", "minhkhoa@careeros.demo", "CANDIDATE", "BLOCKED", "NOT_REQUIRED", 25],
  ["Lâm Thu Hà", "thuha@careeros.demo", "HR", "ACTIVE", "PENDING", 3],
  ["Phan Anh Tú", "anhtu@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 15],
  ["Huỳnh Tú Uyên", "tuyen@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 17],
  ["Trịnh Gia Bảo", "giabao@careeros.demo", "HR", "ACTIVE", "VERIFIED", 22],
  ["Cao Thanh Tâm", "thanhtam@careeros.demo", "CANDIDATE", "ACTIVE", "NOT_REQUIRED", 28],
];

const companyByEmail: Record<string, [string, string]> = {
  "phuongthao@careeros.demo": ["Công ty Công nghệ Sao Mai", "https://saomai.demo"],
  "quocbao@careeros.demo": ["Nền tảng Finverse", "https://finverse.demo"],
  "ngoclinh@careeros.demo": ["Nova Retail Lab", "https://novaretail.demo"],
  "haiyen@careeros.demo": ["Mộc An Studio", "https://mocan.demo"],
  "tuankiet@careeros.demo": ["Công ty Bình Minh", "https://binhminh.demo"],
  "nhatquang@careeros.demo": ["GreenGrid Việt Nam", "https://greengrid.demo"],
  "thuha@careeros.demo": ["Orbit Education", "https://orbit.demo"],
  "giabao@careeros.demo": ["CloudNine Systems", "https://cloudnine.demo"],
};

export const userSeeds: AdminUser[] = rows.map(([fullName, email, role, status, verificationStatus, daysAgo], index) => {
  const company = companyByEmail[email];
  const createdAt = new Date(Date.now() - (daysAgo + 45) * 86_400_000).toISOString();
  const lastActiveAt = new Date(Date.now() - (index % 8) * 3_600_000).toISOString();
  return {
    id: index === 0 ? "usr-admin-001" : `usr-${String(index + 1).padStart(3, "0")}`,
    fullName,
    email,
    role,
    status,
    verificationStatus,
    companyName: company?.[0],
    companyEmail: role === "HR" ? `business.${email}` : undefined,
    companyWebsite: company?.[1],
    verificationNote:
      verificationStatus === "CHANGES_REQUESTED"
        ? "Cần bổ sung ảnh giấy phép kinh doanh rõ nét hơn."
        : verificationStatus === "REJECTED"
          ? "Thông tin công ty chưa thể đối chiếu."
          : undefined,
    createdAt,
    lastActiveAt,
    jobsCount: role === "HR" ? (index % 5) + 1 : 0,
    applicationsCount: role === "CANDIDATE" ? (index % 6) + 1 : 0,
  };
});
