import type { DashboardSnapshot } from "@/models/dashboard";
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

export async function getDashboardSnapshot(
  robotId: string = "RAKSHA-01",
  missionId: string = "MISSION-001"
): Promise<DashboardSnapshot> {
  try {
    const [backendData, weather] = await Promise.all([
      apiFetch<BackendDashboardPayload>(`/dashboard/${robotId}/${missionId}`),
      getWeather(),
    ]);

    return {
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
  } catch (error) {
    console.error("Failed to load dashboard from backend API:", error);
    // If during dev backend is not reachable, fallback to mock to avoid complete crash
    const weather = await getWeather().catch(() => dashboardMock.weather);
    return {
      ...structuredClone(dashboardMock),
      weather,
      snapshotState: "DISCONNECTED",
    };
  }
}