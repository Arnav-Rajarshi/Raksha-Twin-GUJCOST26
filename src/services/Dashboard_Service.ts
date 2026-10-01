import { dashboardMock } from "@/mock-data/dashboard.mock";
import type { DashboardSnapshot } from "@/models/dashboard";

const clone = <T,>(value: T): T => structuredClone(value);

/** This is the sole mock-data boundary. Replace this body with GET /api/dashboard/state later. */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const snapshot = clone(dashboardMock);
  return {
    ...snapshot,
    events: [...snapshot.events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    alerts: snapshot.alerts.filter((alert) => alert.status === "ACTIVE"),
    nearbyServices: [...snapshot.nearbyServices].sort((a, b) => a.distance_km - b.distance_km),
  };
}