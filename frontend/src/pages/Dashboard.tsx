import { memo } from "react";
import {
  Bell,
  ChevronDown,
  Layers3,
  Radio,
  Settings2,
} from "lucide-react";
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

import botAsset from "@/assets/raksha twin bot svg.png";

const enter = (
  x: number,
  y: number,
  delay = 0
) => ({
  initial: {
    opacity: 0,
    x,
    y,
  },

  animate: {
    opacity: 1,
    x: 0,
    y: 0,
  },

  transition: {
    duration: 0.45,
    ease: "easeOut" as const,
    delay,
  },
});


/*
 * These components don't depend on the live robot telemetry.
 * memo() prevents them from re-rendering every time the robot
 * sends a new telemetry update.
 */
const MemoLiveCamera = memo(LiveCamera);
const MemoDetectionPanel = memo(DetectionPanel);
const MemoEnvironmentPanel = memo(EnvironmentPanel);
const MemoMissionTimeline = memo(MissionTimeline);
const MemoAlertStrip = memo(AlertStrip);


export function Dashboard({
  data,
}: {
  data: DashboardSnapshot;
}) {
  /*
   * This is intentionally live.
   *
   * Every telemetry update changes `robot`.
   * React will re-render Dashboard, but the static panels
   * below are memoized and therefore won't re-render.
   */
  const robot = useRobotTelemetry(data.robot);

  return (
    <main className="dashboard-shell">

      {/* Map needs live robot position + heading */}
      <OperationsMap
        data={data}
        robot={robot}
      />

      <div className="console-grid">

        {/* COMMAND BAR */}

        <header className="command-bar">

          <div className="brand-lockup">
            <img
              src={botAsset}
              alt=""
            />

            <div>
              <strong>
                RAKSHA<span>—TWIN</span>
              </strong>

              <small>
                HYBRID RESPONSE SYSTEM
              </small>
            </div>
          </div>


          <div className="bar-cell">
            <small>MISSION</small>

            <strong>
              {data.mission.name}
            </strong>

            <code>
              {data.mission.mission_id}
            </code>
          </div>


          <div className="bar-cell">
            <small>STATUS</small>

            <strong className="healthy-text">
              <i className="live-dot" />

              {data.mission.status}
            </strong>
          </div>


          <div className="bar-cell">
            <small>SECTOR</small>

            <strong>
              {data.mission.sector}
            </strong>
          </div>


          <div className="bar-cell">
            <small>ELAPSED</small>

            <strong className="mono">
              {data.mission.elapsed}
            </strong>
          </div>


          {/* This part SHOULD update with telemetry */}
          <div className="bar-cell">
            <small>DATA</small>

            <strong className="mono">
              {data.snapshotState}
              {" · "}
              {formatTime(robot.last_update)}
            </strong>
          </div>


          {/* This part SHOULD update with telemetry */}
          <div className="bar-cell">
            <small>LINK</small>

            <strong className="healthy-text">
              <Radio size={12} />

              {robot.connection_status === "CONNECTED"
                ? "STABLE"
                : "LOST"}
            </strong>
          </div>


          <nav aria-label="Mission controls">

            <button
              type="button"
              title="Map layers"
            >
              <Layers3 size={15} />
            </button>


            <button
              type="button"
              title="Alerts"
            >
              <Bell size={15} />

              <i>
                {
                  data.alerts.filter(
                    (a) => a.status === "ACTIVE"
                  ).length
                }
              </i>
            </button>


            <button
              type="button"
              title="Settings"
            >
              <Settings2 size={15} />
            </button>


            <button
              type="button"
              className="operator-button"
            >
              <span>OPS 01</span>

              <ChevronDown size={13} />
            </button>

          </nav>

        </header>


        {/* LEFT SIDE */}

        <motion.aside
          className="left-stack"
          {...enter(-16, 0)}
        >

          <MemoLiveCamera
            data={data.camera}
            detections={data.detections}
          />

          <MemoDetectionPanel
            data={data.detections}
          />

        </motion.aside>


        {/* RIGHT SIDE */}

        <motion.aside
          className="right-stack"
          {...enter(16, 0, 0.08)}
        >

          {/* MUST update with telemetry */}
          <RobotStatus
            data={robot}
          />

          {/* Does NOT depend on robot telemetry */}
          <MemoEnvironmentPanel
            onboard={data.environment}
            weather={data.weather}
          />

        </motion.aside>


        {/* BOTTOM */}

        <motion.div
          className="bottom-stack"
          {...enter(0, 16, 0.14)}
        >

          <MemoMissionTimeline
            events={data.events}
          />

          <MemoAlertStrip
            alerts={data.alerts}
          />

        </motion.div>

      </div>

    </main>
  );
}