import {
  Activity,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FileUser,
  Gauge,
  LibraryBig,
  type LucideIcon,
  UsersRound,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const adminPrimaryNavigation: NavigationItem[] = [
  { label: "Tổng quan", href: "/admin/dashboard", icon: Gauge, description: "Nhịp vận hành" },
  { label: "Tài khoản", href: "/admin/users", icon: UsersRound, description: "Nhân sự & ứng viên" },
  { label: "Tin tuyển dụng", href: "/admin/jobs", icon: BriefcaseBusiness, description: "Giám sát cấu hình AI" },
  { label: "Xử lý hồ sơ", href: "/admin/applications", icon: FileUser, description: "Giám sát tiến trình AI" },
  { label: "Kho năng lực", href: "/admin/knowledge", icon: LibraryBig, description: "Dữ liệu nghề nghiệp" },
];

export const adminSecondaryNavigation: NavigationItem[] = [
  { label: "Nhật ký", href: "/admin/activity", icon: Activity, description: "Hoạt động quản trị" },
  { label: "Báo cáo", href: "/admin/reports", icon: ChartNoAxesCombined, description: "Số liệu tổng hợp" },
];

export const hrPrimaryNavigation: NavigationItem[] = [
  { label: "Tổng quan", href: "/hr/dashboard", icon: Gauge, description: "Công việc cần xử lý" },
  { label: "Tin tuyển dụng", href: "/hr/jobs", icon: BriefcaseBusiness, description: "Vị trí đang phụ trách" },
  { label: "Ứng viên", href: "/hr/applications", icon: FileUser, description: "Hồ sơ ứng tuyển" },
  { label: "Ứng viên tiềm năng", href: "/hr/talent-pool", icon: UsersRound, description: "Nguồn ứng viên nội bộ" },
];

export const hrRouteLabels: Record<string, string> = {
  dashboard: "Tổng quan",
  jobs: "Tin tuyển dụng",
  applications: "Ứng viên",
  "talent-pool": "Ứng viên tiềm năng",
  new: "Tạo tin",
  edit: "Chỉnh sửa",
};

export const routeLabels: Record<string, string> = {
  admin: "Quản trị",
  dashboard: "Tổng quan",
  users: "Tài khoản",
  jobs: "Tin tuyển dụng",
  applications: "Xử lý hồ sơ",
  knowledge: "Kho năng lực",
  reports: "Báo cáo",
  activity: "Nhật ký hoạt động",
};
