import type { EnvironmentState, WeatherState } from "@/models/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { formatTime, formatNumber, formatPressure } from "@/utils/formatters";

const hazardTone = (s: EnvironmentState["hazard_status"]) =>
  s === "CRITICAL" ? "critical" : s === "WARNING" ? "warning" : "healthy";

const compass = (deg: number) =>
  ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round((deg || 0) / 45) % 8];

export function EnvironmentPanel({
  onboard,
  weather,
}: {
  onboard: EnvironmentState;
  weather: WeatherState;
}) {
  const w = weather;

  return (
    <Panel title="Environment" code="ENV.04" className="environment-panel">
      <div className="env-label">
        <span>ONBOARD SENSORS</span>
        <b className={`${hazardTone(onboard.hazard_status)}-text`}>■ {onboard.hazard_status}</b>
      </div>
      <div className="env-grid">
        <Cell label="TEMP" value={formatNumber(onboard.temperature, 1)} unit="°C" />
        <Cell label="RH" value={formatNumber(onboard.humidity, 0)} unit="%" />
        <Cell label="GAS" value={formatNumber(onboard.gas_value, 2)} unit="ppm" />
        <Cell label="RANGE" value={formatNumber(onboard.range_m, 1)} unit="m" />
      </div>

      <div className="env-label">
        <span>EXTERNAL · {weather.source}</span>
        <b>OBS {formatTime(weather.observed_at)}</b>
      </div>
      <div className="env-grid">
        <Cell label="TEMP" value={formatNumber(w.current?.temperature_c, 1)} unit="°C" />
        <Cell label="RH" value={formatNumber(w.current?.humidity_percent, 0)} unit="%" />
        <Cell
          label="WIND"
          value={formatNumber(w.current?.wind_speed_kmph, 1)}
          unit={`km/h ${compass(w.current?.wind_direction || 0)}`}
        />
        <Cell label="PRESS" value={formatPressure(w.current?.pressure_hpa)} unit="hPa" />
        <Cell label="RAIN 24H" value={formatNumber(w.current?.rainfall_24h_mm, 1)} unit="mm" />
        <Cell label="FETCHED" value={formatTime(weather.fetched_at).slice(0, 5)} unit="UTC" />
      </div>

      <div className={`weather-foot ${weather.warnings?.length ? "warning-text" : ""}`}>
        {weather.warnings?.length
          ? `▲ ${weather.warnings.join(" · ")}`
          : "● NO ACTIVE WEATHER WARNING"}
      </div>
    </Panel>
  );
}

function Cell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="env-cell">
      <span>{label}</span>
      <strong>
        {value}
        <em>{unit}</em>
      </strong>
    </div>
  );
}
