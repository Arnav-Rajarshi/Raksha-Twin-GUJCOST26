import { dashboardMock } from "@/mock-data/dashboard.mock";
import type { RobotState } from "@/models/dashboard";

export const getRobotStatus = (): RobotState => structuredClone(dashboardMock.robot);

/**
 * Mock telemetry stream. Later replace with the WebSocket feed (VITE_WS_BASE_URL).
 * Emits small variations around the mock robot state so the UI can animate.
 */
export function subscribeRobotTelemetry(onUpdate: (state: RobotState) => void): () => void {
  const base = getRobotStatus();
  let tick = 0;
  const id = setInterval(() => {
    tick += 1;
    const wobble = Math.sin(tick / 3);
    const heading = (base.heading + wobble * 14 + 360) % 360;
    onUpdate({
      ...base,
      heading: Math.round(heading),
      speed: +(base.speed + wobble * 0.6).toFixed(1),
      location: { ...base.location, altitude: +(base.location.altitude + Math.cos(tick / 4) * 1.4).toFixed(1) },
      orientation: { ...base.orientation, yaw: +heading.toFixed(1) },
      last_update: new Date(Date.parse(base.last_update) + tick * 2000).toISOString(),
    });
  }, 2000);
  return () => clearInterval(id);
}
