import { Boxes, CircleAlert, PersonStanding } from "lucide-react";
import type { DetectionSummary } from "@/models/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { formatTime } from "@/utils/formatters";

export function DetectionPanel({ data }: { data: DetectionSummary }) {
  const items = [{ label: "Persons", value: data.person_count, icon: PersonStanding, tone: "healthy" }, { label: "Debris", value: data.debris_count, icon: Boxes, tone: "warning" }, { label: "Obstacle", value: data.obstacle_count, icon: CircleAlert, tone: "critical" }];
  return <Panel title="Perception" code="AI.03" className="detection-panel"><div className="detection-counts">{items.map(({ label, value, icon: Icon, tone }) => <div key={label} className={`detection ${tone}`}><Icon size={16}/><strong>{value}</strong><span>{label}</span></div>)}</div><div className="latest-detection"><span>LATEST CLASSIFICATION</span><strong>{data.latest_detection.type} / {(data.latest_detection.confidence * 100).toFixed(0)}%</strong><time>{formatTime(data.latest_detection.timestamp)}</time></div></Panel>;
}