"use client";

import { useSyncExternalStore } from "react";
import { getMockScenario, subscribeMockScenario } from "@/mocks/mock-scenarios";

export function useMockScenario() {
  return useSyncExternalStore(subscribeMockScenario, getMockScenario, getMockScenario);
}
