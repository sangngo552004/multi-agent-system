import type { AdminService } from "@/services/contracts/admin-service";
import { mockAdminService } from "@/services/mock/mock-admin.service";

// Đổi implementation này sang HttpAdminService khi backend sẵn sàng.
export const adminService: AdminService = mockAdminService;
