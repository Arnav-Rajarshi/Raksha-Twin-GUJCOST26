import cameraFrame from "@/assets/mock-camera-frame.jpg";
import type { DashboardSnapshot } from "@/models/dashboard";

const baseTimestamp = "2026-10-01T18:54:20.000Z";

export const dashboardMock: DashboardSnapshot = {
  mission: {
    mission_id: "MISSION-001",
    name: "Flood Rescue A",
    status: "ACTIVE",
    sector: "Sector 07 / Ludhiana",
    started_at: "2026-10-01T17:42:00.000Z",
    elapsed: "01:12:20",
  },
  robot: {
    robot_id: "RAKSHA-01",
    mission_id: "MISSION-001",
    location: { latitude: 21.76, longitude: 72.15, altitude: 42.5 },
    speed: 8.4,
    heading: 184,
    orientation: { roll: 1.2, pitch: -0.8, yaw: 185.4 },
    mode: "AERIAL",
    battery_remaining: 76,
    connection_status: "CONNECTED",
    gps_satellites: 16,
    last_update: baseTimestamp,
  },
  path: {
    robot_id: "RAKSHA-01",
    mission_id: "MISSION-001",
    path: {
      type: "LineString",
      coordinates: [
        [75.846, 30.894], [75.849, 30.896], [75.851, 30.899], [75.854, 30.898],
        [75.8555, 30.9005], [75.8573, 30.901],
      ],
    },
    start_time: "2026-10-01T17:42:00.000Z",
    last_updated: baseTimestamp,
  },
  environment: {
    temperature: 31.4,
    humidity: 67,
    gas_value: 0.42,
    range_m: 18.6,
    hazard_status: "NORMAL",
    last_update: baseTimestamp,
  },
  weather: {
    location: { latitude: 30.901, longitude: 75.8573 },
    source: "Open-Meteo",
    fetched_at: "2026-10-01T18:50:00.000Z",
    observed_at: "2026-10-01T18:30:00.000Z",
    current: {
      temperature_c: 30.8,
      humidity_percent: 71,
      wind_speed_kmph: 18,
      wind_direction: 290,
      pressure_hpa: 1007,
      rainfall_24h_mm: 4.2,
      weather_code: 2,
    },
    warnings: [],
  },
  detections: {
    person_count: 3,
    debris_count: 2,
    obstacle_count: 1,
    latest_detection: { type: "PERSON", confidence: 0.94, timestamp: baseTimestamp },
    updated_at: baseTimestamp,
  },
  events: [
    { event_id: "EVENT-006", mission_id: "MISSION-001", robot_id: "RAKSHA-01", timestamp: "2026-10-01T18:54:20.000Z", event_type: "PERSON_DETECTED", severity: "HIGH", source: "YOLO", message: "Person located near collapsed structure", location: { type: "Point", coordinates: [75.8573, 30.901] }, metadata: { confidence: 0.94 } },
    { event_id: "EVENT-005", mission_id: "MISSION-001", robot_id: "RAKSHA-01", timestamp: "2026-10-01T18:51:42.000Z", event_type: "GAS_HAZARD_CLEARED", severity: "LOW", source: "SENSOR", message: "Gas reading returned to nominal range", location: { type: "Point", coordinates: [75.8555, 30.9005] }, metadata: { gas_value: 0.42 } },
    { event_id: "EVENT-004", mission_id: "MISSION-001", robot_id: "RAKSHA-01", timestamp: "2026-10-01T18:48:09.000Z", event_type: "MODE_CHANGED", severity: "MEDIUM", source: "PIXHAWK", message: "Aerial mode engaged", location: { type: "Point", coordinates: [75.854, 30.898] }, metadata: { mode: "AERIAL" } },
    { event_id: "EVENT-003", mission_id: "MISSION-001", robot_id: "RAKSHA-01", timestamp: "2026-10-01T18:43:17.000Z", event_type: "OBSTACLE_DETECTED", severity: "MEDIUM", source: "YOLO", message: "Road obstruction classified as debris", location: { type: "Point", coordinates: [75.851, 30.899] }, metadata: { confidence: 0.88 } },
  ],
  alerts: [
    { alert_id: "ALERT-001", mission_id: "MISSION-001", robot_id: "RAKSHA-01", timestamp: "2026-10-01T18:54:20.000Z", type: "PERSON_DETECTED", severity: "HIGH", message: "Human detected — operator review required", location: { type: "Point", coordinates: [75.8573, 30.901] }, status: "ACTIVE", resolved_at: null },
  ],
  nearbyServices: [
    { service_id: "POI-01", category: "HOSPITAL", name: "Civil Hospital", location: { latitude: 30.907, longitude: 75.862 }, distance_km: 1.2 },
    { service_id: "POI-02", category: "FIRE_STATION", name: "Central Fire Station", location: { latitude: 30.895, longitude: 75.849 }, distance_km: 1.7 },
    { service_id: "POI-03", category: "POLICE", name: "Division 4 Police", location: { latitude: 30.904, longitude: 75.845 }, distance_km: 2.1 },
    { service_id: "POI-04", category: "SHELTER", name: "Relief Camp Alpha", location: { latitude: 30.893, longitude: 75.86 }, distance_km: 2.4 },
  ],
  camera: {
    camera_id: "CAM-01",
    stream_url: null,
    preview_frame_url: cameraFrame,
    stream_fps: 30,
    connection_status: "CONNECTED",
    camera_resolution: "1920 × 1080",
    latest_detection: { type: "PERSON", confidence: 0.94, timestamp: baseTimestamp },
  },
  operatorLocation: { latitude: 30.897, longitude: 75.852 },
  snapshotState: "LIVE",
};