import { Bell, ChevronDown, Layers3, Radio, Settings2 } from "lucide-react";
import { motion } from "motion/react";
import type { DashboardSnapshot } from "@/models/dashboard";
import { OperationsMap } from "@/components/map/OperationsMap";
import { LiveCamera } from "@/components/camera/LiveCamera";
import { RobotStatus } from "@/components/robot-status/RobotStatus";
import { EnvironmentPanel } from "@/components/environment/EnvironmentPanel";
import { DetectionPanel } from "@/components/detections/DetectionPanel";
import { MissionTimeline } from "@/components/mission-log/MissionTimeline";
import { AlertStrip } from "@/components/alerts/AlertStrip";
import { useRobotTelemetry } from "@/hooks/useRobotTelemetry";
import { formatTime } from "@/utils/formatters";
import botAsset from "@/assets/raksha_twin_bot.png.asset.json";

const enter = (x: number, y: number, delay = 0) => ({ initial: { opacity: 0, x, y }, animate: { opacity: 1, x: 0, y: 0 }, transition: { duration: 0.45, ease: "easeOut" as const, delay } });

export function Dashboard({ data }: { data: DashboardSnapshot }) {
  const robot = useRobotTelemetry(data.robot);
  return (
    <main className="dashboard-shell">
      <OperationsMap data={data} robot={robot} />
      <div className="console-grid">
        <header className="command-bar">
          <div className="brand-lockup"><img src={botAsset.url} alt="" /><div><strong>RAKSHA<span>—TWIN</span></strong><small>HYBRID RESPONSE SYSTEM</small></div></div>
          <div className="bar-cell"><small>MISSION</small><strong>{data.mission.name}</strong><code>{data.mission.mission_id}</code></div>
          <div className="bar-cell"><small>STATUS</small><strong className="healthy-text"><i className="live-dot" />{data.mission.status}</strong></div>
          <div className="bar-cell"><small>SECTOR</small><strong>{data.mission.sector}</strong></div>
          <div className="bar-cell"><small>ELAPSED</small><strong className="mono">{data.mission.elapsed}</strong></div>
          <div className="bar-cell"><small>DATA</small><strong className="mono">{data.snapshotState} · {formatTime(robot.last_update)}</strong></div>
          <div className="bar-cell"><small>LINK</small><strong className="healthy-text"><Radio size={12} />{robot.connection_status === "CONNECTED" ? "STABLE" : "LOST"}</strong></div>
          <nav aria-label="Mission controls">
            <button type="button" title="Map layers"><Layers3 size={15} /></button>
            <button type="button" title="Alerts"><Bell size={15} /><i>{data.alerts.filter((a) => a.status === "ACTIVE").length}</i></button>
            <button type="button" title="Settings"><Settings2 size={15} /></button>
            <button type="button" className="operator-button"><span>OPS 01</span><ChevronDown size={13} /></button>
          </nav>
        </header>
        <motion.aside className="left-stack" {...enter(-16, 0)}>
          <LiveCamera data={data.camera} detections={data.detections} />
          <DetectionPanel data={data.detections} />
        </motion.aside>
        <motion.aside className="right-stack" {...enter(16, 0, 0.08)}>
          <RobotStatus data={robot} />
          <EnvironmentPanel onboard={data.environment} weather={data.weather} />
        </motion.aside>
        <motion.div className="bottom-stack" {...enter(0, 16, 0.14)}>
          <MissionTimeline events={data.events} />
          <AlertStrip alerts={data.alerts} />
        </motion.div>
      </div>
    </main>
  );
}
