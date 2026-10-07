import type { RobotState } from "@/models/dashboard";
import { apiFetch } from "./apiClient";

export async function fetchLatestTelemetry(
  robotId: string = "RAKSHA-01",
  missionId: string = "MISSION-001"
): Promise<RobotState> {
  return apiFetch<RobotState>(`/telemetry/latest/${robotId}/${missionId}`);
}

/**
 * Polls backend for live robot telemetry at specified interval.
 * Returns an unsubscribe function to clean up the interval.
 */
export function subscribeRobotTelemetry(
  onUpdate: (state: RobotState) => void,
  intervalMs: number = 2000,
  robotId: string = "RAKSHA-01",
  missionId: string = "MISSION-001"
): () => void {
  let isSubscribed = true;

  const poll = async () => {
    try {
      const live = await fetchLatestTelemetry(robotId, missionId);
      if (isSubscribed) {
        onUpdate(live);
      }
    } catch (err) {
      console.warn("Telemetry polling update failed:", err);
    }
  };

  const id = setInterval(poll, intervalMs);

  return () => {
    isSubscribed = false;
    clearInterval(id);
  };
}
