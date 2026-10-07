import { Boxes, CircleAlert, PersonStanding } from "lucide-react";
import type { DetectionSummary } from "@/models/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { formatTime } from "@/utils/formatters";

export function DetectionPanel({ data }: { data: DetectionSummary }) {
  const items = [
    { label: "PERSONS", value: data.person_count, icon: PersonStanding, tone: "critical" },
    { label: "DEBRIS", value: data.debris_count, icon: Boxes, tone: "warning" },
    { label: "OBSTACLES", value: data.obstacle_count, icon: CircleAlert, tone: "accent" },
  ];
  const conf = Math.round(data.latest_detection.confidence * 100);
  return (
    <Panel title="AI Perception" code="AI.03" className="detection-panel">
      <div className="detection-counts">
        {items.map(({ label, value, icon: Icon, tone }) => <div key={label} className={`detection ${tone}`}><span><Icon size={12} />{label}</span><strong>{String(value).padStart(2, "0")}</strong></div>)}
      </div>
      <div className="latest-detection">
        <div><small>LATEST CLASS</small><strong>{data.latest_detection.type}</strong></div>
        <div className="conf"><small>CONF {conf}%</small><div className="conf-bar"><i style={{ width: `${conf}%` }} /></div></div>
        <time>{formatTime(data.latest_detection.timestamp)}</time>
      </div>
    </Panel>
  );
}
