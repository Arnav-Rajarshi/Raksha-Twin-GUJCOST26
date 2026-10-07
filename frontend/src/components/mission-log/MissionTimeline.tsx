import { motion } from "motion/react";
import type { MissionEvent } from "@/models/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { formatTime, severityTone } from "@/utils/formatters";

interface MissionTimelineProps {
  events: MissionEvent[];
  className?: string;
  compact?: boolean;
}

export function MissionTimeline({
  events,
  className = "",
  compact = false,
}: MissionTimelineProps) {
  const displayEvents = compact ? events.slice(0, 3) : events;

  return (
    <Panel
      title="Mission activity"
      code="LOG.06"
      className={`mission-panel ${compact ? "is-compact-timeline" : ""} ${className}`}
    >
      <div className="event-head">
        <span>TIME UTC</span>
        <span>SEV</span>
        <span>EVENT</span>
        <span>DETAIL</span>
        <span>SOURCE</span>
      </div>

      <div className="event-list">
        {displayEvents.length === 0 ? (
          <div className="event-empty">NO MISSION ACTIVITY RECORDED</div>
        ) : (
          displayEvents.map((event, i) => (
            <motion.article
              key={event.event_id}
              className={severityTone(event.severity)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
            >
              <time>{formatTime(event.timestamp)}</time>
              <span className="sev">{event.severity}</span>
              <strong className="event-type">{event.event_type.replaceAll("_", " ")}</strong>
              <span className="msg" title={event.message}>
                {event.message}
              </span>
              <code>{event.source}</code>
            </motion.article>
          ))
        )}
      </div>
    </Panel>
  );
}
