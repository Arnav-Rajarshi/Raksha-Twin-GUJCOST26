import type { EnvironmentState } from "@/models/dashboard";
import { apiFetch } from "./apiClient";

export async function getEnvironment(
  robotId: string = "RAKSHA-01",
  missionId: string = "MISSION-001"
): Promise<EnvironmentState> {
  return apiFetch<EnvironmentState>(`/sensor/latest/${robotId}/${missionId}`);
}