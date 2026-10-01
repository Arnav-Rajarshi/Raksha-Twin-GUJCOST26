import { BatteryMedium, Radio } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { RobotState } from "@/models/dashboard";
import { formatCoordinate, formatTime } from "@/utils/formatters";
import { Panel } from "@/components/dashboard/Panel";
import { RobotVisual } from "./RobotVisual";

function batteryState(pct: number) {
  if (pct < 20) return { label: "CRITICAL", tone: "critical" };
  if (pct < 40) return { label: "LOW", tone: "warning" };
  return { label: "NOMINAL", tone: "healthy" };
}

function Value({ value }: { value: string }) {
  return <AnimatePresence mode="popLayout" initial={false}><motion.span key={value} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.25 }}>{value}</motion.span></AnimatePresence>;
}

export function RobotStatus({ data }: { data: RobotState }) {
  const battery = batteryState(data.battery_remaining);
  const connected = data.connection_status === "CONNECTED";
  const gpsLock = data.gps_satellites >= 6 ? "3D FIX" : "NO FIX";
  const rows: [string, string, string][] = [
    ["SPEED", data.speed.toFixed(1), "m/s"],
    ["ALT", data.location.altitude.toFixed(1), "m"],
    ["HDG", String(data.heading).padStart(3, "0"), "°"],
    ["GPS", `${data.gps_satellites}`, `SAT · ${gpsLock}`],
    ["ROLL", data.orientation.roll.toFixed(1), "°"],
    ["PITCH", data.orientation.pitch.toFixed(1), "°"],
  ];
  return (
    <Panel title="Robot status" code="SYS.02" className="status-panel">
      <div className="robot-identity">
        <div><small>PLATFORM</small><strong>{data.robot_id}</strong><small>{data.mission_id}</small></div>
        <span className={`mode-tag ${data.mode === "AERIAL" ? "aerial" : ""}`}>{data.mode}</span>
      </div>
      <div className="robot-top">
        <RobotVisual heading={data.heading} flying={data.mode === "AERIAL"} />
        <div className="battery-block">
          <small><BatteryMedium size={12} />BATTERY</small>
          <strong>{data.battery_remaining}<em>%</em></strong>
          <div className="battery-cells">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < Math.round(data.battery_remaining / 10) ? battery.tone : ""} />)}</div>
          <span className={`state-label ${battery.tone}`}>■ {battery.label}</span>
        </div>
      </div>
      <dl className="telemetry-grid">
        {rows.map(([k, v, u]) => <div key={k}><dt>{k}</dt><dd><Value value={v} /><em>{u}</em></dd></div>)}
      </dl>
      <div className="coordinate-row"><span>LAT {formatCoordinate(data.location.latitude, "lat")}</span><span>LNG {formatCoordinate(data.location.longitude, "lng")}</span></div>
      <div className="status-footer">
        <span className={connected ? "healthy-text" : "critical-text"}><Radio size={11} />{connected ? "LINK · TELEMETRY OK" : "LINK LOST"}</span>
        <time>UPD {formatTime(data.last_update)}</time>
      </div>
    </Panel>
  );
}
