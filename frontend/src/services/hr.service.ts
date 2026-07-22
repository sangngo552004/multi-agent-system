import type { HrService } from "@/services/contracts/hr-service";
import { mockHrService } from "@/services/mock/mock-hr.service";

// Đổi implementation này sang HttpHrService khi backend sẵn sàng.
export const hrService: HrService = mockHrService;
