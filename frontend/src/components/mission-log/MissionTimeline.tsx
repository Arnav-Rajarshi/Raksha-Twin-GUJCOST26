import { motion } from "motion/react";
import type { MissionEvent } from "@/models/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { formatTime, severityTone } from "@/utils/formatters";

export function MissionTimeline({ events }: { events: MissionEvent[] }) {
  return (
    <Panel title="Mission activity" code="LOG.06" className="mission-panel">
      <div className="event-head"><span>TIME UTC</span><span>SEV</span><span>EVENT</span><span>DETAIL</span><span>SOURCE</span></div>
      <div className="event-list">
        {events.map((event, i) => (
          <motion.article key={event.event_id} className={severityTone(event.severity)} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
            <time>{formatTime(event.timestamp)}</time>
            <span className="sev">{event.severity}</span>
            <strong>{event.event_type.replaceAll("_", " ")}</strong>
            <span className="msg">{event.message}</span>
            <code>{event.source}</code>
          </motion.article>
        ))}
      </div>
    </Panel>
  );
}
