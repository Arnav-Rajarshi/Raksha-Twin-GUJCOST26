import { dashboardMock } from "@/mock-data/dashboard.mock";
import type { DashboardSnapshot } from "@/models/dashboard";
import { getRobotStatus } from "./RobotStatus_Service";
import { getLocationMap } from "./LocationMap_Service";
import { getCameraFeed } from "./CameraFeed_Service";
import { getEnvironment } from "./Environment_Service";
import { getWeather } from "./Weather_Service";
import { getDetections } from "./Detection_Service";
import { getMissionEvents } from "./MissionLog_Service";
import { getActiveAlerts } from "./Alert_Service";
import { getNearbyServices } from "./NearbyServices_Service";

/** This is the sole mock-data boundary. Replace this body with GET /api/dashboard/state later. */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const map = getLocationMap();
  return {
    mission: structuredClone(dashboardMock.mission),
    robot: getRobotStatus(),
    path: map.path,
    operatorLocation: map.operatorLocation,
    camera: getCameraFeed(),
    environment: getEnvironment(),
    weather: getWeather(),
    detections: getDetections(),
    events: getMissionEvents(),
    alerts: getActiveAlerts(),
    nearbyServices: getNearbyServices(),
    snapshotState: dashboardMock.snapshotState,
  };
}