import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import type { Alert } from "@/models/dashboard";
import { formatTime, severityTone } from "@/utils/formatters";
import { Panel } from "@/components/dashboard/Panel";
import { resolveAlert } from "@/services/Alert_Service";

interface AlertStripProps {
  alerts: Alert[];
  className?: string;
  onAlertResolved?: (alertId: string) => void;
}

export function AlertStrip({ alerts, className = "", onAlertResolved }: AlertStripProps) {
  const [acked, setAcked] = useState<Record<string, boolean>>({});
  const [resolving, setResolving] = useState<Record<string, boolean>>({});

  const active = alerts.filter((a) => a.status === "ACTIVE");

  const handleAcknowledge = async (alertId: string) => {
    setAcked((s) => ({ ...s, [alertId]: true }));
    setResolving((s) => ({ ...s, [alertId]: true }));
    try {
      await resolveAlert(alertId);
      if (onAlertResolved) {
        onAlertResolved(alertId);
      }
    } catch (err) {
      console.warn("Could not resolve alert on backend:", err);
    } finally {
      setResolving((s) => ({ ...s, [alertId]: false }));
    }
  };

  return (
    <Panel
      title="Operator alerts"
      code={`ALR · ${active.length}`}
      className={`alert-panel ${className}`}
    >
      <div className="alert-list">
        {alerts.length === 0 ? (
          <div className="alert-empty">
            <CheckCircle2 size={14} />
            <span>NO ACTIVE ALERTS</span>
          </div>
        ) : (
          alerts.map((alert) => {
            const isAck = acked[alert.alert_id];
            const isPending = resolving[alert.alert_id];
            const isResolved = alert.status === "RESOLVED" || isAck;

            return (
              <motion.div
                key={alert.alert_id}
                className={`alert-item ${severityTone(alert.severity)} ${isResolved ? "acked" : ""}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="alert-row">
                  <AlertTriangle size={14} />
                  <strong>{alert.severity}</strong>
                  <span className="alert-type">{alert.type.replaceAll("_", " ")}</span>
                  <time>{formatTime(alert.timestamp)}</time>
                </div>

                <p className="alert-msg">{alert.message}</p>

                <div className="alert-row alert-actions">
                  <small>
                    {isResolved
                      ? "ACKNOWLEDGED · OPS 01"
                      : alert.status === "RESOLVED"
                      ? "RESOLVED"
                      : "AWAITING OPERATOR"}
                  </small>
                  {!isResolved && alert.status === "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(alert.alert_id)}
                      disabled={isPending}
                    >
                      {isPending ? "RESOLVING…" : "ACKNOWLEDGE"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Panel>
  );
}
