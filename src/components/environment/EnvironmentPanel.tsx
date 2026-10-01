import { CloudRain, Droplets, Gauge, Thermometer, Wind } from "lucide-react";
import type { EnvironmentState, WeatherState } from "@/models/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { formatTime } from "@/utils/formatters";

export function EnvironmentPanel({ onboard, weather }: { onboard: EnvironmentState; weather: WeatherState }) {
  return <Panel title="Environmental" code="ENV.04" className="environment-panel">
    <div className="env-section"><div className="env-label"><span>ONBOARD SENSORS</span><b className="healthy-text">{onboard.hazard_status}</b></div><div className="env-readings"><Metric icon={Thermometer} label="TEMP" value={`${onboard.temperature.toFixed(1)}°C`} /><Metric icon={Droplets} label="RH" value={`${onboard.humidity}%`} /><Metric icon={Gauge} label="GAS" value={onboard.gas_value.toFixed(2)} /><Metric icon={ScanRangeIcon} label="RANGE" value={`${onboard.range_m.toFixed(1)}m`} /></div></div>
    <div className="env-divider" />
    <div className="env-section"><div className="env-label"><span>EXTERNAL WEATHER</span><b>IMD · {formatTime(weather.observed_at)}</b></div><div className="env-readings"><Metric icon={Thermometer} label="TEMP" value={`${weather.current.temperature_c.toFixed(1)}°C`} /><Metric icon={Droplets} label="RH" value={`${weather.current.humidity_percent}%`} /><Metric icon={Wind} label="WIND" value={`${weather.current.wind_speed_kmph}km/h`} /><Metric icon={CloudRain} label="RAIN" value={`${weather.current.rainfall_24h_mm}mm`} /></div><div className="weather-foot">PRESS {weather.current.pressure_hpa} hPa <span>{weather.warnings.length ? weather.warnings.join(" · ") : "NO ACTIVE WARNING"}</span></div></div>
  </Panel>;
}

const ScanRangeIcon = Gauge;
function Metric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) { return <div><Icon size={13}/><span>{label}</span><strong>{value}</strong></div>; }