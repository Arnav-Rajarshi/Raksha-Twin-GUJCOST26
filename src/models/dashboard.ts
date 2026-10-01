export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DataState = "LIVE" | "CACHED" | "STALE" | "DISCONNECTED";

export interface RobotState {
  robot_id: string;
  mission_id: string;
  location: { latitude: number; longitude: number; altitude: number };
  speed: number;
  heading: number;
  orientation: { roll: number; pitch: number; yaw: number };
  mode: "AERIAL" | "GROUND";
  battery_remaining: number;
  connection_status: "CONNECTED" | "DISCONNECTED";
  gps_satellites: number;
  last_update: string;
}

export interface RobotPath {
  robot_id: string;
  mission_id: string;
  path: { type: "LineString"; coordinates: [number, number][] };
  start_time: string;
  last_updated: string;
}

export interface EnvironmentState {
  temperature: number;
  humidity: number;
  gas_value: number;
  range_m: number;
  hazard_status: "NORMAL" | "WARNING" | "CRITICAL";
  last_update: string;
}

export interface WeatherState {
  location: { latitude: number; longitude: number };
  source: "IMD";
  fetched_at: string;
  observed_at: string;
  current: {
    temperature_c: number;
    humidity_percent: number;
    wind_speed_kmph: number;
    wind_direction: number;
    pressure_hpa: number;
    rainfall_24h_mm: number;
    weather_code: number;
  };
  warnings: string[];
}

export interface DetectionSummary {
  person_count: number;
  debris_count: number;
  obstacle_count: number;
  latest_detection: { type: string; confidence: number; timestamp: string };
  updated_at: string;
}

export interface Mission {
  mission_id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETE";
  sector: string;
  started_at: string;
  elapsed: string;
}

export interface MissionEvent {
  event_id: string;
  mission_id: string;
  robot_id: string;
  timestamp: string;
  event_type: string;
  severity: Severity;
  source: string;
  message: string;
  location: { type: "Point"; coordinates: [number, number] };
  metadata: Record<string, number | string>;
}

export interface Alert {
  alert_id: string;
  mission_id: string;
  robot_id: string;
  timestamp: string;
  type: string;
  severity: Severity;
  message: string;
  location: { type: "Point"; coordinates: [number, number] };
  status: "ACTIVE" | "RESOLVED";
  resolved_at: string | null;
}

export interface NearbyService {
  service_id: string;
  category: "HOSPITAL" | "FIRE_STATION" | "POLICE" | "SHELTER";
  name: string;
  location: { latitude: number; longitude: number };
  distance_km: number;
}

export interface CameraState {
  camera_id: string;
  stream_url: string | null;
  /** Frontend-only mock still frame used until a real stream is available. */
  preview_frame_url?: string | null;
  stream_fps?: number;
  connection_status: "CONNECTED" | "DISCONNECTED";
  camera_resolution: string;
  latest_detection: DetectionSummary["latest_detection"];
}

export interface DashboardSnapshot {
  mission: Mission;
  robot: RobotState;
  path: RobotPath;
  environment: EnvironmentState;
  weather: WeatherState;
  detections: DetectionSummary;
  events: MissionEvent[];
  alerts: Alert[];
  nearbyServices: NearbyService[];
  camera: CameraState;
  operatorLocation: { latitude: number; longitude: number };
  snapshotState: DataState;
}