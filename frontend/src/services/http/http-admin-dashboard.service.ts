"use client";

import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import type {
  DashboardData,
  DashboardRange,
} from "@/features/admin/dashboard/dashboard.types";
import { apiRequest } from "@/services/http/api-client";
import type {
  ActivityEntry,
  AiProcessingStatus,
} from "@/types/domain/admin";

type DashboardApiResponse = {
  rangeDays: DashboardRange;
  generatedAt: string;
  hasData: boolean;
  metrics: {
    totalUsers: number;
    blockedUsers: number;
    openJobs: number;
    incompleteJobs: number;
    applicationsInRange: number;
    aiCompletedInRange: number;
    aiFailedInRange: number;
    aiCompletionRate: number;
  };
  aiStatusCounts: Record<AiProcessingStatus, number>;
  applicationTrend: Array<{ date: string; count: number }>;
  recentActivities: ActivityEntry[];
};

const AI_STATUS_PRESENTATION: Record<
  AiProcessingStatus,
  { label: string; color: string }
> = {
  COMPLETED: { label: "Hoàn thành", color: "#2f7d53" },
  PROCESSING: { label: "Đang xử lý", color: "#3b74c5" },
  WAITING: { label: "Đang chờ", color: "#d8f05f" },
  FAILED: { label: "Thất bại", color: "#e76545" },
};

const AI_STATUS_ORDER: AiProcessingStatus[] = [
  "COMPLETED",
  "PROCESSING",
  "WAITING",
  "FAILED",
];

function mapDashboard(response: DashboardApiResponse): DashboardData {
  const { metrics } = response;
  return {
    range: response.rangeDays,
    generatedAt: response.generatedAt,
    hasData: response.hasData,
    metrics: [
      {
        id: "users",
        label: "Tổng tài khoản",
        value: metrics.totalUsers,
        change: "Toàn hệ thống",
        href: "/admin/users",
      },
      {
        id: "blocked-users",
        label: "Tài khoản bị khóa",
        value: metrics.blockedUsers,
        change: "Cần rà soát",
        href: "/admin/users?status=BLOCKED",
        emphasis: metrics.blockedUsers > 0,
      },
      {
        id: "jobs",
        label: "Vị trí đang tuyển",
        value: metrics.openJobs,
        change: `${metrics.incompleteJobs} thiếu cấu hình AI`,
        href: "/admin/jobs?status=OPEN",
      },
      {
        id: "applications",
        label: `Ứng tuyển / ${response.rangeDays} ngày`,
        value: metrics.applicationsInRange,
        change: "Theo ngày nộp",
        href: `/admin/applications?date=${response.rangeDays}`,
      },
      {
        id: "ai-rate",
        label: "AI hoàn thành",
        value: metrics.aiCompletionRate,
        suffix: "%",
        change: `${metrics.aiFailedInRange} hồ sơ lỗi`,
        href: `/admin/applications?aiStatus=FAILED&date=${response.rangeDays}`,
      },
    ],
    attention: [
      {
        id: "accounts",
        label: "Rà soát quyền truy cập",
        description:
          "Tài khoản đang bị khóa cần kiểm tra hoặc hỗ trợ",
        count: metrics.blockedUsers,
        href: "/admin/users?status=BLOCKED",
        tone: "warning",
      },
      {
        id: "jobs",
        label: "Hoàn thiện cấu hình đối sánh",
        description:
          "Tin tuyển dụng đang thiếu dữ liệu để AI đánh giá",
        count: metrics.incompleteJobs,
        href: "/admin/jobs?readiness=INCOMPLETE",
        tone: "info",
      },
      {
        id: "ai",
        label: "Xử lý AI thất bại",
        description: `Hồ sơ lỗi trong ${response.rangeDays} ngày cần kiểm tra hoặc chạy lại`,
        count: metrics.aiFailedInRange,
        href: `/admin/applications?aiStatus=FAILED&date=${response.rangeDays}`,
        tone: "danger",
      },
    ],
    aiStatuses: AI_STATUS_ORDER.map((status) => ({
      status,
      label: AI_STATUS_PRESENTATION[status].label,
      value: response.aiStatusCounts[status] ?? 0,
      color: AI_STATUS_PRESENTATION[status].color,
    })),
    trend: response.applicationTrend.map((item) => ({
      date: item.date,
      label: format(
        parseISO(item.date),
        response.rangeDays === 7 ? "EEE" : "dd/MM",
        { locale: vi },
      ),
      applications: item.count,
    })),
    recentActivities: response.recentActivities,
  };
}

export const httpAdminDashboardService = {
  async getDashboard(range: DashboardRange) {
    const response = await apiRequest<DashboardApiResponse>(
      `/api/v1/admin/dashboard?rangeDays=${range}`,
    );
    return mapDashboard(response);
  },
};
