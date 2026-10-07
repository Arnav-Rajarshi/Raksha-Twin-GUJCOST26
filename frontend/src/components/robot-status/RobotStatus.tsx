import { BatteryMedium, Radio } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { RobotState } from "@/models/dashboard";
import { formatCoordinate, formatTime, formatNumber } from "@/utils/formatters";
import { Panel } from "@/components/dashboard/Panel";
import { RobotVisual } from "./RobotVisual";

function batteryState(pct: number) {
  if (pct < 20) return { label: "CRITICAL", tone: "critical" };
  if (pct < 40) return { label: "LOW", tone: "warning" };
  return { label: "NOMINAL", tone: "healthy" };
}

function Value({ value }: { value: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.25 }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

export function RobotStatus({ data }: { data: RobotState }) {
  const batteryPct = Math.max(0, Math.min(100, Math.round(data.battery_remaining || 0)));
  const battery = batteryState(batteryPct);
  const connected = data.connection_status === "CONNECTED";
  const satCount = data.gps_satellites ?? 0;
  const gpsLock = satCount >= 6 ? "3D FIX" : "NO FIX";

  const rows: [string, string, string][] = [
    ["SPEED", formatNumber(data.speed, 1), "m/s"],
    ["ALT", formatNumber(data.location?.altitude, 1), "m"],
    ["HDG", String(Math.round(data.heading || 0)).padStart(3, "0"), "°"],
    ["GPS", `${satCount}`, `SAT · ${gpsLock}`],
    ["ROLL", formatNumber(data.orientation?.roll, 1), "°"],
    ["PITCH", formatNumber(data.orientation?.pitch, 1), "°"],
  ];

  return (
    <Panel title="Robot status" code="SYS.02" className="status-panel">
      <div className="robot-identity">
        <div>
          <small>PLATFORM</small>
          <strong>{data.robot_id}</strong>
          <small>{data.mission_id}</small>
        </div>
        <span className={`mode-tag ${data.mode === "AERIAL" ? "aerial" : ""}`}>
          {data.mode}
        </span>
      </div>

      <div className="robot-top">
        <RobotVisual heading={data.heading || 0} flying={data.mode === "AERIAL"} />
        <div className="battery-block">
          <small>
            <BatteryMedium size={12} />
            BATTERY
          </small>
          <strong>
            {batteryPct}
            <em>%</em>
          </strong>
          <div className="battery-cells">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} className={i < Math.round(batteryPct / 10) ? battery.tone : ""} />
            ))}
          </div>
          <span className={`state-label ${battery.tone}`}>■ {battery.label}</span>
        </div>
      </div>

      <dl className="telemetry-grid">
        {rows.map(([k, v, u]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>
              <Value value={v} />
              <em>{u}</em>
            </dd>
          </div>
        ))}
      </dl>

      <div className="coordinate-row">
        <span>LAT {formatCoordinate(data.location?.latitude, "lat")}</span>
        <span>LNG {formatCoordinate(data.location?.longitude, "lng")}</span>
      </div>

      <div className="status-footer">
        <span className={connected ? "healthy-text" : "critical-text"}>
          <Radio size={11} />
          {connected ? "LINK · TELEMETRY OK" : "LINK LOST"}
        </span>
        <time>UPD {formatTime(data.last_update)}</time>
      </div>
    </Panel>
  );
}
