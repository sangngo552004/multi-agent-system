import type { HrService } from "@/services/contracts/hr-service";
import { httpHrService } from "@/services/http/http-hr.service";

export const hrService: HrService = httpHrService;
