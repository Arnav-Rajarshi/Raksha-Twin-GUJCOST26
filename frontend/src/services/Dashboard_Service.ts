import type { DashboardSnapshot, MissionSummary, DataState } from "@/models/dashboard";
import { apiFetch } from "./apiClient";
import { getWeather } from "./Weather_Service";
import { getCameraFeed } from "./CameraFeed_Service";
import { dashboardMock } from "@/mock-data/dashboard.mock";

interface BackendDashboardPayload {
  mission: DashboardSnapshot["mission"];
  robot: DashboardSnapshot["robot"];
  path: DashboardSnapshot["path"];
  environment: DashboardSnapshot["environment"];
  detections: DashboardSnapshot["detections"];
  events: DashboardSnapshot["events"];
  alerts: DashboardSnapshot["alerts"];
  nearbyServices: DashboardSnapshot["nearbyServices"];
}

// In-memory cache for preserving the last valid snapshot when link is disrupted
let lastValidSnapshot: DashboardSnapshot | null = null;

export async function getDashboardSnapshot(
  robotId: string = "RAKSHA-01",
  missionId: string = "MISSION-001"
): Promise<DashboardSnapshot> {
  try {
    const [backendData, weather] = await Promise.all([
      apiFetch<BackendDashboardPayload>(`/dashboard/${robotId}/${missionId}`),
      getWeather().catch((err) => {
        console.warn("Weather fetch failed, utilizing fallback:", err);
        return {
          location: { latitude: 30.901, longitude: 75.8573 },
          source: "Open-Meteo" as const,
          fetched_at: new Date().toISOString(),
          observed_at: new Date().toISOString(),
          current: {
            temperature_c: 0,
            humidity_percent: 0,
            wind_speed_kmph: 0,
            wind_direction: 0,
            pressure_hpa: 0,
            rainfall_24h_mm: 0,
            weather_code: 0,
          },
          warnings: ["WEATHER FEED DISCONNECTED"],
        };
      }),
    ]);

    const snapshot: DashboardSnapshot = {
      mission: backendData.mission,
      robot: backendData.robot,
      path: backendData.path,
      environment: backendData.environment,
      weather,
      detections: backendData.detections,
      events: backendData.events,
      alerts: backendData.alerts,
      nearbyServices: backendData.nearbyServices,
      camera: getCameraFeed(),
      operatorLocation: structuredClone(dashboardMock.operatorLocation),
      snapshotState: "LIVE",
    };

    lastValidSnapshot = structuredClone(snapshot);
    return snapshot;
  } catch (error) {
    console.error(`API connection error for ${robotId}/${missionId}:`, error);

    // If we have a previous valid snapshot for this robot & mission, mark it STALE/DISCONNECTED
    if (
      lastValidSnapshot &&
      lastValidSnapshot.robot.robot_id === robotId &&
      lastValidSnapshot.mission.mission_id === missionId
    ) {
      return {
        ...lastValidSnapshot,
        robot: {
          ...lastValidSnapshot.robot,
          connection_status: "DISCONNECTED",
        },
        snapshotState: "STALE",
      };
    }

    // Do NOT return fake mock operational telemetry; re-throw so UI shows explicit error state
    throw error;
  }
}

export async function listPreviousMissions(robotId?: string): Promise<MissionSummary[]> {
  const endpoint = robotId ? `/missions?robot_id=${encodeURIComponent(robotId)}` : "/missions";
  return apiFetch<MissionSummary[]>(endpoint);
}

export function clearSnapshotCache() {
  lastValidSnapshot = null;
}