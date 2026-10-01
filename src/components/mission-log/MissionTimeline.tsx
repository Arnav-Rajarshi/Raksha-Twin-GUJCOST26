import type { MissionEvent } from "@/models/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { formatTime, severityTone } from "@/utils/formatters";

export function MissionTimeline({ events }: { events: MissionEvent[] }) {
  return <Panel title="Mission activity" code="LOG.06" className="mission-panel"><div className="event-list">{events.map((event) => <article key={event.event_id}><i className={severityTone(event.severity)} /><time>{formatTime(event.timestamp)}</time><div><strong>{event.event_type.replaceAll("_", " ")}</strong><span>{event.message}</span></div><code>{event.source}</code></article>)}</div></Panel>;
}