import type { RobotPath } from "@/models/dashboard";
import { apiFetch } from "./apiClient";
import { dashboardMock } from "@/mock-data/dashboard.mock";

export async function getLocationMap(
  robotId: string = "RAKSHA-01",
  missionId: string = "MISSION-001"
): Promise<{ path: RobotPath; operatorLocation: { latitude: number; longitude: number } }> {
  const path = await apiFetch<RobotPath>(`/telemetry/path/${robotId}/${missionId}`);
  return {
    path,
    operatorLocation: structuredClone(dashboardMock.operatorLocation),
  };
}