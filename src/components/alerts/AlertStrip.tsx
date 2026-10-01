import { AlertTriangle } from "lucide-react";
import type { Alert } from "@/models/dashboard";
import { formatTime } from "@/utils/formatters";

export function AlertStrip({ alerts }: { alerts: Alert[] }) {
  const alert = alerts[0];
  if (!alert) return null;
  return <div className="alert-strip"><AlertTriangle size={15}/><strong>{alert.severity} ALERT</strong><span>{alert.message}</span><time>{formatTime(alert.timestamp)}</time><button type="button">ACKNOWLEDGE</button></div>;
}