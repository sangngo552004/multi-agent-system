import type {
  CareerLevelInput,
  CompetencyInput,
  CompetencyView,
  JobFamilyInput,
  KnowledgeOverview,
  ToggleKnowledgeInput,
} from "@/features/admin/knowledge/knowledge.types";
import { mockDatabase } from "@/mocks/mock-database";
import { getMockScenario } from "@/mocks/mock-scenarios";
import type { ActivityEntry, Competency, CompetencyLevel } from "@/types/domain/admin";

const QUERY_DELAY = 320;
const MUTATION_DELAY = 480;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function createId(prefix: string, name: string, existingIds: string[]) {
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const base = `${prefix}-${slug || Date.now()}`;
  let candidate = base;
  let suffix = 2;
  while (existingIds.includes(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function ensureUniqueName(items: Array<{ id: string; name: string }>, id: string | undefined, name: string, label: string) {
  const duplicated = items.some((item) => item.id !== id && normalizeName(item.name) === normalizeName(name));
  if (duplicated) throw new Error(`${label} này đã tồn tại.`);
}

function addActivity(description: string, label: string, href = "/admin/knowledge") {
  const entry: ActivityEntry = { id: `act-knowledge-${Date.now()}`, kind: "KNOWLEDGE_CHANGED", actorName: "Admin Nguyễn", description, targetLabel: label, targetHref: href, createdAt: new Date().toISOString() };
  mockDatabase.addActivity(entry);
}

function getOverview(): KnowledgeOverview {
  const state = mockDatabase.snapshot();
  return {
    jobFamilies: state.jobFamilies.map((item) => ({ ...item, usageCount: state.jobs.filter((job) => job.jobFamilyId === item.id).length })),
    careerLevels: state.careerLevels.map((item) => ({ ...item, usageCount: state.jobs.filter((job) => job.careerLevelId === item.id).length })).sort((a, b) => a.rankValue - b.rankValue),
    competencies: state.competencies.map((item) => ({ ...item, usageCount: state.jobs.filter((job) => job.competencies.some((requirement) => requirement.competencyId === item.id)).length, completedLevels: item.levels.filter((level) => level.description.trim()).length })),
  };
}

const defaultLevelTitles = ["Cơ bản", "Thực hành", "Độc lập", "Thành thạo", "Chuyên gia"];

class MockKnowledgeService {
  async getKnowledge(): Promise<KnowledgeOverview> {
    await delay(QUERY_DELAY);
    if (getMockScenario() === "empty") return { jobFamilies: [], careerLevels: [], competencies: [] };
    return getOverview();
  }

  async getCompetency(id: string): Promise<CompetencyView> {
    await delay(QUERY_DELAY);
    const item = getOverview().competencies.find((entry) => entry.id === id);
    if (!item) throw new Error("Không tìm thấy năng lực.");
    return item;
  }

  async saveJobFamily(input: JobFamilyInput) {
    await delay(MUTATION_DELAY);
    const state = mockDatabase.snapshot();
    ensureUniqueName(state.jobFamilies, input.id, input.name, "Nhóm nghề");
    const existing = input.id ? state.jobFamilies.find((item) => item.id === input.id) : undefined;
    const item = { id: existing?.id ?? createId("family", input.name, state.jobFamilies.map((entry) => entry.id)), name: input.name.trim(), description: input.description.trim(), status: existing?.status ?? "ACTIVE" as const };
    mockDatabase.replaceJobFamilies(existing ? state.jobFamilies.map((entry) => entry.id === item.id ? item : entry) : [...state.jobFamilies, item]);
    if (existing) {
      state.jobs.filter((job) => job.jobFamilyId === item.id).forEach((job) => {
        mockDatabase.updateJob(job.id, { jobFamilyName: item.name });
      });
    }
    addActivity(existing ? "đã cập nhật nhóm nghề" : "đã thêm nhóm nghề", item.name);
    return item;
  }

  async saveCareerLevel(input: CareerLevelInput) {
    await delay(MUTATION_DELAY);
    const state = mockDatabase.snapshot();
    ensureUniqueName(state.careerLevels, input.id, input.name, "Cấp bậc");
    if (state.careerLevels.some((item) => item.id !== input.id && item.rankValue === input.rankValue)) {
      throw new Error(`Thứ tự cấp bậc ${input.rankValue} đã được sử dụng.`);
    }
    const existing = input.id ? state.careerLevels.find((item) => item.id === input.id) : undefined;
    const item = { id: existing?.id ?? createId("level", input.name, state.careerLevels.map((entry) => entry.id)), name: input.name.trim(), description: input.description.trim(), rankValue: input.rankValue, status: existing?.status ?? "ACTIVE" as const };
    mockDatabase.replaceCareerLevels(existing ? state.careerLevels.map((entry) => entry.id === item.id ? item : entry) : [...state.careerLevels, item]);
    if (existing) {
      state.jobs.filter((job) => job.careerLevelId === item.id).forEach((job) => {
        mockDatabase.updateJob(job.id, { careerLevelName: item.name });
      });
    }
    addActivity(existing ? "đã cập nhật cấp bậc" : "đã thêm cấp bậc", item.name);
    return item;
  }

  async saveCompetency(input: CompetencyInput) {
    await delay(MUTATION_DELAY);
    const state = mockDatabase.snapshot();
    ensureUniqueName(state.competencies, input.id, input.name, "Năng lực");
    const existing = input.id ? state.competencies.find((item) => item.id === input.id) : undefined;
    const item: Competency = { id: existing?.id ?? createId("comp", input.name, state.competencies.map((entry) => entry.id)), name: input.name.trim(), category: input.category.trim(), description: input.description.trim(), status: existing?.status ?? "ACTIVE", levels: existing?.levels ?? defaultLevelTitles.map((title, index) => ({ level: index + 1, title, description: "" })) };
    mockDatabase.replaceCompetencies(existing ? state.competencies.map((entry) => entry.id === item.id ? item : entry) : [...state.competencies, item]);
    if (existing) {
      state.jobs.filter((job) => job.competencies.some((requirement) => requirement.competencyId === item.id)).forEach((job) => {
        mockDatabase.updateJob(job.id, {
          competencies: job.competencies.map((requirement) => requirement.competencyId === item.id ? { ...requirement, name: item.name } : requirement),
        });
      });
    }
    addActivity(existing ? "đã cập nhật năng lực" : "đã thêm năng lực", item.name, `/admin/knowledge/competencies/${item.id}`);
    return getOverview().competencies.find((entry) => entry.id === item.id) as CompetencyView;
  }

  async saveCompetencyLevels(id: string, levels: CompetencyLevel[]) {
    await delay(MUTATION_DELAY);
    const state = mockDatabase.snapshot();
    const existing = state.competencies.find((item) => item.id === id);
    if (!existing) throw new Error("Không tìm thấy năng lực.");
    const updated = { ...existing, levels: structuredClone(levels) };
    mockDatabase.replaceCompetencies(state.competencies.map((item) => item.id === id ? updated : item));
    addActivity("đã cập nhật thang năng lực", updated.name, `/admin/knowledge/competencies/${id}`);
    return getOverview().competencies.find((item) => item.id === id) as CompetencyView;
  }

  async toggleKnowledge(input: ToggleKnowledgeInput) {
    await delay(MUTATION_DELAY);
    const overview = getOverview();
    const collection = input.entity === "JOB_FAMILY" ? overview.jobFamilies : input.entity === "CAREER_LEVEL" ? overview.careerLevels : overview.competencies;
    const current = collection.find((item) => item.id === input.id);
    if (!current) throw new Error("Không tìm thấy dữ liệu cần cập nhật.");
    if (input.status === "INACTIVE" && current.usageCount > 0 && !input.force) throw new Error(`Mục này đang được dùng bởi ${current.usageCount} tin tuyển dụng.`);
    const state = mockDatabase.snapshot();
    if (input.entity === "JOB_FAMILY") mockDatabase.replaceJobFamilies(state.jobFamilies.map((item) => item.id === input.id ? { ...item, status: input.status } : item));
    if (input.entity === "CAREER_LEVEL") mockDatabase.replaceCareerLevels(state.careerLevels.map((item) => item.id === input.id ? { ...item, status: input.status } : item));
    if (input.entity === "COMPETENCY") mockDatabase.replaceCompetencies(state.competencies.map((item) => item.id === input.id ? { ...item, status: input.status } : item));
    addActivity(input.status === "ACTIVE" ? "đã bật sử dụng" : "đã ngừng sử dụng", current.name);
    return getOverview();
  }
}

export const mockKnowledgeService = new MockKnowledgeService();
