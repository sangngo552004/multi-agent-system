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
  { label: "Người dùng", href: "/admin/users", icon: UsersRound, description: "Tài khoản & HR" },
  { label: "Tin tuyển dụng", href: "/admin/jobs", icon: BriefcaseBusiness, description: "Kiểm duyệt tin" },
  { label: "Hồ sơ ứng tuyển", href: "/admin/applications", icon: FileUser, description: "Tiến trình AI" },
  { label: "Kho năng lực", href: "/admin/knowledge", icon: LibraryBig, description: "Dữ liệu nghề nghiệp" },
];

export const adminSecondaryNavigation: NavigationItem[] = [
  { label: "Nhật ký", href: "/admin/activity", icon: Activity, description: "Hoạt động quản trị" },
  { label: "Báo cáo", href: "/admin/reports", icon: ChartNoAxesCombined, description: "Số liệu tổng hợp" },
];

export const routeLabels: Record<string, string> = {
  admin: "Quản trị",
  dashboard: "Tổng quan",
  users: "Người dùng",
  jobs: "Tin tuyển dụng",
  applications: "Hồ sơ ứng tuyển",
  knowledge: "Kho năng lực",
  reports: "Báo cáo",
  activity: "Nhật ký hoạt động",
};
