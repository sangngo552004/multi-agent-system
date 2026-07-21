export type MockScenario = "normal" | "empty" | "ai-error";

let activeScenario: MockScenario = "normal";
const scenarioListeners = new Set<() => void>();

export function getMockScenario() {
  return activeScenario;
}

export function setMockScenario(scenario: MockScenario) {
  if (activeScenario === scenario) return;
  activeScenario = scenario;
  scenarioListeners.forEach((listener) => listener());
}

export function subscribeMockScenario(listener: () => void) {
  scenarioListeners.add(listener);
  return () => {
    scenarioListeners.delete(listener);
  };
}
