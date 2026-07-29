"use client";

import { httpAdminActivityService } from "@/services/http/http-admin-activity.service";
import { httpAdminApplicationService } from "@/services/http/http-admin-application.service";
import { httpAdminDashboardService } from "@/services/http/http-admin-dashboard.service";
import { httpAdminJobService } from "@/services/http/http-admin-job.service";
import { httpAdminKnowledgeService } from "@/services/http/http-admin-knowledge.service";
import { httpAdminUserService } from "@/services/http/http-admin-user.service";

export const httpAdminService = {
  ...httpAdminDashboardService,
  ...httpAdminUserService,
  ...httpAdminJobService,
  ...httpAdminKnowledgeService,
  ...httpAdminApplicationService,
  ...httpAdminActivityService,
};
