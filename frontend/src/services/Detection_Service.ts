import type { DetectionSummary } from "@/models/dashboard";
import { apiFetch } from "./apiClient";

export async function getDetections(
  robotId: string = "RAKSHA-01",
  missionId: string = "MISSION-001"
): Promise<DetectionSummary> {
  return apiFetch<DetectionSummary>(`/detections/latest/${robotId}/${missionId}`);
}