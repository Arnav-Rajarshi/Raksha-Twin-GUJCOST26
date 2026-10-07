import type { MissionEvent } from "@/models/dashboard";
import { apiFetch } from "./apiClient";

export async function getMissionEvents(missionId: string = "MISSION-001"): Promise<MissionEvent[]> {
  return apiFetch<MissionEvent[]>(`/events/${missionId}`);
}