import { useState, useCallback } from "react";
import {
  Bell,
  ChevronDown,
  Layers3,
  Radio,
  Settings2,
  Tv,
  Map as MapIcon,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import type { DashboardSnapshot, DashboardView } from "@/models/dashboard";
import { OperationsMap } from "@/components/map/OperationsMap";
import { LiveCamera } from "@/components/camera/LiveCamera";
import { RobotStatus } from "@/components/robot-status/RobotStatus";
import { EnvironmentPanel } from "@/components/environment/EnvironmentPanel";
import { DetectionPanel } from "@/components/detections/DetectionPanel";
import { MissionTimeline } from "@/components/mission-log/MissionTimeline";
import { AlertStrip } from "@/components/alerts/AlertStrip";

import { useRobotTelemetry } from "@/hooks/useRobotTelemetry";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { formatTime } from "@/utils/formatters";
import botAsset from "@/assets/raksha twin bot svg.png";

const enter = (x: number, y: number, delay = 0) => ({
  initial: { opacity: 0, x, y },
  animate: { opacity: 1, x: 0, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const, delay },
});

interface DashboardProps {
  data: DashboardSnapshot;
  onSwitchMission?: () => void;
}

export function Dashboard({ data, onSwitchMission }: DashboardProps) {
  const [viewMode, setViewMode] = useState<DashboardView>("MAP");
  const robot = useRobotTelemetry(data.robot);
  const tod = useTimeOfDay();

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "MAP" ? "CAMERA" : "MAP"));
  }, []);

  const TodIcon =
    tod.phase === "DAY"
      ? Sun
      : tod.phase === "NIGHT"
      ? Moon
      : tod.phase === "DUSK"
      ? Sunset
      : Sunrise;

  const isConnected = robot.connection_status === "CONNECTED";
  const isStale = data.snapshotState === "STALE" || data.snapshotState === "DISCONNECTED";

  return (
    <main
      className={`dashboard-shell ${
        viewMode === "CAMERA" ? "mode-camera-focus" : "mode-map-primary"
      }`}
    >
      {/* Background Map Component */}
      <OperationsMap data={data} robot={robot} receded={viewMode === "CAMERA"} />

      {/* Main Console Grid */}
      <div className={`console-grid ${viewMode === "CAMERA" ? "console-grid-camera" : ""}`}>
        {/* ==================== COMMAND BAR ==================== */}
        <header className="command-bar">
          <div className="brand-lockup">
            <img src={botAsset} alt="RAKSHA-TWIN" />
            <div>
              <strong>
                RAKSHA<span>—TWIN</span>
              </strong>
              <small>HYBRID RESPONSE SYSTEM</small>
            </div>
          </div>

          <div className="bar-cell bar-cell-mission" title={data.mission.name}>
            <small>MISSION</small>
            <strong className="truncate-text">{data.mission.name}</strong>
            <code>{data.mission.mission_id}</code>
          </div>

          <div className="bar-cell bar-cell-status">
            <small>STATUS</small>
            <strong className="healthy-text">
              <i className="live-dot" />
              {data.mission.status}
            </strong>
          </div>

          <div className="bar-cell bar-cell-sector" title={data.mission.sector}>
            <small>SECTOR</small>
            <strong className="truncate-text">{data.mission.sector}</strong>
          </div>

          <div className="bar-cell bar-cell-elapsed">
            <small>ELAPSED</small>
            <strong className="mono">{data.mission.elapsed}</strong>
          </div>

          {/* Connection / Link State */}
          <div className="bar-cell bar-cell-data">
            <small>DATA LINK</small>
            <strong className={`mono ${isStale ? "critical-text" : "healthy-text"}`}>
              {isStale ? "STALE" : data.snapshotState}
              {" · "}
              {formatTime(robot.last_update)}
            </strong>
          </div>

          <div className="bar-cell bar-cell-link">
            <small>TELEMETRY</small>
            <strong className={isConnected ? "healthy-text" : "critical-text"}>
              <Radio size={12} />
              {isConnected ? "CONNECTED" : "LINK LOST"}
            </strong>
          </div>

          {/* Time of Day HUD Chip */}
          <div className="bar-cell bar-cell-tod">
            <small>SOLAR / TOD</small>
            <strong className="mono flex items-center gap-1">
              <TodIcon size={12} className="tod-icon" />
              {tod.phase}
            </strong>
          </div>

          {/* Tactical Nav Controls */}
          <nav aria-label="Mission controls">
            {/* View Mode Switcher Button */}
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "CAMERA" ? "active" : ""}`}
              onClick={toggleViewMode}
              title={viewMode === "MAP" ? "Switch to Camera View" : "Switch to Map View"}
            >
              {viewMode === "MAP" ? <Tv size={14} /> : <MapIcon size={14} />}
              <span>{viewMode === "MAP" ? "CAM" : "MAP"}</span>
            </button>

            {onSwitchMission && (
              <button
                type="button"
                className="switch-mission-btn"
                onClick={onSwitchMission}
                title="Switch / Load Another Mission"
              >
                <LogOut size={13} />
                <span>LOAD</span>
              </button>
            )}

            <button type="button" title="Map layers">
              <Layers3 size={15} />
            </button>

            <button type="button" title="Alerts">
              <Bell size={15} />
              {data.alerts.filter((a) => a.status === "ACTIVE").length > 0 && (
                <i>{data.alerts.filter((a) => a.status === "ACTIVE").length}</i>
              )}
            </button>

            <button type="button" title="Settings">
              <Settings2 size={15} />
            </button>

            <button type="button" className="operator-button">
              <span>OPS 01</span>
              <ChevronDown size={13} />
            </button>
          </nav>
        </header>

        {/* ==================== VIEW MODES ==================== */}
        <AnimatePresence mode="wait">
          {viewMode === "MAP" ? (
            /* ------------------- MAP MODE (DEFAULT) ------------------- */
            <div key="map-layout" className="normal-layout-container">
              {/* Left Side */}
              <motion.aside className="left-stack" {...enter(-16, 0)}>
                <LiveCamera
                  data={data.camera}
                  detections={data.detections}
                  isFocused={false}
                  onToggleFocus={toggleViewMode}
                />
                <DetectionPanel data={data.detections} layoutMode="horizontal" />
              </motion.aside>

              {/* Right Side */}
              <motion.aside className="right-stack" {...enter(16, 0, 0.08)}>
                <RobotStatus data={robot} />
                <EnvironmentPanel onboard={data.environment} weather={data.weather} />
              </motion.aside>

              {/* Bottom Stack */}
              <motion.div className="bottom-stack" {...enter(0, 16, 0.14)}>
                <MissionTimeline events={data.events} />
                <AlertStrip alerts={data.alerts} />
              </motion.div>
            </div>
          ) : (
            /* ------------------- CAMERA FOCUS MODE ------------------- */
            <div key="camera-focus-layout" className="camera-focus-container">
              {/* Left Stack: Vertical AI Perception + Attached Alerts */}
              <motion.aside className="camera-focus-left" {...enter(-16, 0)}>
                <DetectionPanel data={data.detections} layoutMode="vertical" />
                <AlertStrip alerts={data.alerts} className="attached-alerts-panel" />
              </motion.aside>

              {/* Central Large Camera Frame */}
              <motion.section className="camera-hero-section" {...enter(0, -10, 0.05)}>
                <LiveCamera
                  data={data.camera}
                  detections={data.detections}
                  isFocused={true}
                  onToggleFocus={toggleViewMode}
                />
              </motion.section>

              {/* Right Stack: Status & Environment */}
              <motion.aside className="camera-focus-right" {...enter(16, 0, 0.08)}>
                <RobotStatus data={robot} />
                <EnvironmentPanel onboard={data.environment} weather={data.weather} />
              </motion.aside>

              {/* Bottom Activity Section (Scrollable under fold) */}
              <motion.div className="camera-focus-bottom" {...enter(0, 16, 0.12)}>
                <div className="bottom-fold-header">
                  <span>
                    MISSION EVENT LOG // ALL ENTRIES ({data.events.length})
                  </span>
                </div>
                <MissionTimeline events={data.events} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}