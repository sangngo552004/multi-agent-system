import { mockDatabase } from "@/mocks/mock-database";
import { setMockScenario } from "@/mocks/mock-scenarios";

export function resetDemoData() {
  mockDatabase.reset();
  setMockScenario("normal");
}
