import type { Alert } from "@/models/dashboard";
import { apiFetch } from "./apiClient";

export async function getActiveAlerts(missionId: string = "MISSION-001"): Promise<Alert[]> {
  const alerts = await apiFetch<Alert[]>(`/alerts/${missionId}`);
  return alerts.filter((alert) => alert.status === "ACTIVE");
}

export async function resolveAlert(alertId: string): Promise<void> {
  await apiFetch(`/alerts/${alertId}/resolve`, { method: "PATCH" });
}