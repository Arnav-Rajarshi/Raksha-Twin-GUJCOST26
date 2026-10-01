import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import type { Alert } from "@/models/dashboard";
import { formatTime, severityTone } from "@/utils/formatters";
import { Panel } from "@/components/dashboard/Panel";

export function AlertStrip({ alerts }: { alerts: Alert[] }) {
  const [acked, setAcked] = useState<Record<string, boolean>>({});
  const active = alerts.filter((a) => a.status === "ACTIVE");
  return (
    <Panel title="Operator alerts" code={`ALR · ${active.length}`} className="alert-panel">
      {alerts.length === 0 && <div className="alert-empty"><CheckCircle2 size={14} />NO ACTIVE ALERTS</div>}
      {alerts.map((alert) => {
        const isAck = acked[alert.alert_id];
        return (
          <motion.div key={alert.alert_id} className={`alert-item ${severityTone(alert.severity)} ${isAck ? "acked" : ""}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="alert-row"><AlertTriangle size={14} /><strong>{alert.severity}</strong><span>{alert.type.replaceAll("_", " ")}</span><time>{formatTime(alert.timestamp)}</time></div>
            <p>{alert.message}</p>
            <div className="alert-row">
              <small>{isAck ? "ACKNOWLEDGED · OPS 01" : alert.status === "RESOLVED" ? "RESOLVED" : "AWAITING OPERATOR"}</small>
              {!isAck && alert.status === "ACTIVE" && <button type="button" onClick={() => setAcked((s) => ({ ...s, [alert.alert_id]: true }))}>ACKNOWLEDGE</button>}
            </div>
          </motion.div>
        );
      })}
    </Panel>
  );
}
