export const formatTime = (value?: string | null): string => {
  if (!value) return "--:--:--";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(11, 19) || "--:--:--";
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(d);
  } catch {
    return "--:--:--";
  }
};

export const formatCoordinate = (value: number, axis: "lat" | "lng"): string => {
  if (typeof value !== "number" || isNaN(value)) return "0.0000°";
  const direction = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${Math.abs(value).toFixed(4)}°${direction}`;
};

export const severityTone = (severity: string): "critical" | "warning" | "healthy" => {
  if (severity === "CRITICAL") return "critical";
  if (severity === "HIGH" || severity === "MEDIUM") return "warning";
  return "healthy";
};

export const formatNumber = (val: number | undefined | null, decimals: number = 1): string => {
  if (typeof val !== "number" || isNaN(val)) return "0.0";
  return val.toFixed(decimals);
};

export const formatPressure = (hpa: number | undefined | null): string => {
  if (typeof hpa !== "number" || isNaN(hpa)) return "--";
  return Math.round(hpa).toString();
};