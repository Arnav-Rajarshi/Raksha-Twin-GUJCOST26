import { Bell, ChevronDown, CircleDot, Layers3, Radio, Settings2 } from "lucide-react";
import { motion } from "motion/react";
import type { DashboardSnapshot } from "@/models/dashboard";
import { OperationsMap } from "@/components/map/OperationsMap";
import { LiveCamera } from "@/components/camera/LiveCamera";
import { RobotStatus } from "@/components/robot-status/RobotStatus";
import { EnvironmentPanel } from "@/components/environment/EnvironmentPanel";
import { DetectionPanel } from "@/components/detections/DetectionPanel";
import { MissionTimeline } from "@/components/mission-log/MissionTimeline";
import { AlertStrip } from "@/components/alerts/AlertStrip";
import botAsset from "@/assets/raksha_twin_bot.png.asset.json";

export function Dashboard({ data }: { data: DashboardSnapshot }) {
  return <main className="dashboard-shell">
    <OperationsMap data={data} />
    <header className="command-bar">
      <div className="brand-lockup"><img src={botAsset.url} alt=""/><div><strong>RAKSHA<span>—TWIN</span></strong><small>HYBRID RESPONSE SYSTEM</small></div></div>
      <div className="mission-title"><span><i/>MISSION ACTIVE</span><strong>{data.mission.name}</strong><small>{data.mission.sector}</small></div>
      <nav aria-label="Mission controls"><button type="button" title="Map layers"><Layers3 size={16}/></button><button type="button" title="Alerts"><Bell size={16}/><i>{data.alerts.length}</i></button><button type="button" title="Settings"><Settings2 size={16}/></button><button type="button" className="operator-button"><span>OPS 01</span><ChevronDown size={14}/></button></nav>
    </header>
    <AlertStrip alerts={data.alerts}/>
    <motion.aside className="left-stack" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .45, ease: "easeOut" }}>
      <LiveCamera data={data.camera}/><DetectionPanel data={data.detections}/>
    </motion.aside>
    <motion.aside className="right-stack" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .45, ease: "easeOut", delay: .08 }}>
      <RobotStatus data={data.robot}/><EnvironmentPanel onboard={data.environment} weather={data.weather}/>
    </motion.aside>
    <motion.div className="bottom-stack" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: "easeOut", delay: .14 }}><MissionTimeline events={data.events}/></motion.div>
    <div className="mission-readout"><span><CircleDot size={11}/>M01</span><div><small>MISSION ELAPSED</small><strong>{data.mission.elapsed}</strong></div><div><small>LINK</small><strong className="healthy-text"><Radio size={12}/>STABLE</strong></div></div>
  </main>;
}