import { BatteryMedium, Gauge, Navigation, Radio, Satellite, ScanLine } from "lucide-react";
import type { RobotState } from "@/models/dashboard";
import { formatCoordinate, formatTime } from "@/utils/formatters";
import { Panel } from "@/components/dashboard/Panel";

export function RobotStatus({ data }: { data: RobotState }) {
  const metrics = [
    { label: "Velocity", value: data.speed.toFixed(1), unit: "m/s", icon: Gauge },
    { label: "Altitude", value: data.location.altitude.toFixed(1), unit: "m", icon: ScanLine },
    { label: "Heading", value: data.heading.toString().padStart(3, "0"), unit: "°", icon: Navigation },
    { label: "GPS lock", value: data.gps_satellites.toString(), unit: "SAT", icon: Satellite },
  ];
  return <Panel title="Robot status" code="SYS.02" className="status-panel">
    <div className="robot-identity"><div><small>PLATFORM</small><strong>{data.robot_id}</strong></div><span className="mode-tag">{data.mode}</span></div>
    <div className="battery-row"><BatteryMedium size={18} /><div><small>BATTERY / NORMAL</small><strong>{data.battery_remaining}%</strong></div><div className="battery-track"><i style={{ width: `${data.battery_remaining}%` }} /></div></div>
    <div className="metric-grid">{metrics.map(({ label, value, unit, icon: Icon }) => <div key={label}><Icon size={14}/><small>{label}</small><strong>{value}<em>{unit}</em></strong></div>)}</div>
    <div className="coordinate-row"><span>{formatCoordinate(data.location.latitude, "lat")}</span><span>{formatCoordinate(data.location.longitude, "lng")}</span></div>
    <div className="status-footer"><span><Radio size={12}/>{data.connection_status}</span><time>UPD {formatTime(data.last_update)}</time></div>
  </Panel>;
}