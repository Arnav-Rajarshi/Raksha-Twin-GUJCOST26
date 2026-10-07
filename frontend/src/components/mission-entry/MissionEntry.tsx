import { useState, useEffect } from "react";
import {
  Radio,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react";
import type { MissionSummary } from "@/models/dashboard";
import { listPreviousMissions } from "@/services/Dashboard_Service";
import { formatTime } from "@/utils/formatters";
import botAsset from "@/assets/raksha twin bot svg.png";

interface MissionEntryProps {
  initialRobotId?: string;
  initialMissionId?: string;
  onSelectMission: (robotId: string, missionId: string) => void;
  errorMessage?: string | null;
}

export function MissionEntry({
  initialRobotId = "RT001",
  initialMissionId = "MI007",
  onSelectMission,
  errorMessage: initialError,
}: MissionEntryProps) {
  const [robotId, setRobotId] = useState(initialRobotId);
  const [missionId, setMissionId] = useState(initialMissionId);
  const [previousMissions, setPreviousMissions] = useState<MissionSummary[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    setIsLoadingMissions(true);
    try {
      const missions = await listPreviousMissions();
      setPreviousMissions(missions);
    } catch (err) {
      console.warn("Could not fetch previous missions list:", err);
    } finally {
      setIsLoadingMissions(false);
    }
  };

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!robotId.trim() || !missionId.trim()) {
      setError("Please specify both a valid Robot ID and Mission ID.");
      return;
    }
    setError(null);
    setIsValidating(true);
    onSelectMission(robotId.trim(), missionId.trim());
  };

  const handleSelectPrevious = (m: MissionSummary) => {
    setRobotId(m.robot_id);
    setMissionId(m.mission_id);
    setError(null);
    setIsValidating(true);
    onSelectMission(m.robot_id, m.mission_id);
  };

  return (
    <div className="mission-entry-screen">
      <div className="mission-entry-container">
        {/* Header Branding */}
        <header className="entry-header">
          <div className="entry-brand">
            <img src={botAsset} alt="RAKSHA-TWIN" className="entry-logo" />
            <div>
              <h1>
                RAKSHA<span>—TWIN</span>
              </h1>
              <small>MISSION CONTROL // INITIALIZATION PROTOCOL</small>
            </div>
          </div>
          <div className="entry-sys-status">
            <span>
              <i className="live-dot" /> SYSTEM READY
            </span>
            <code>SEC.LEVEL 01</code>
          </div>
        </header>

        {error && (
          <div className="entry-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="entry-grid">
          {/* Section A: Load / Re-Initiate Mission */}
          <section className="entry-panel primary-entry">
            <div className="panel-header">
              <span>
                <Shield size={13} />
                INITIALIZE OPERATIONAL MISSION
              </span>
              <code>INIT.01</code>
            </div>

            <form onSubmit={handleInitialize} className="entry-form">
              <div className="form-group">
                <label htmlFor="robot-id">PLATFORM / ROBOT ID</label>
                <div className="input-wrapper">
                  <input
                    id="robot-id"
                    type="text"
                    value={robotId}
                    onChange={(e) => setRobotId(e.target.value.toUpperCase())}
                    placeholder="e.g. RT001"
                    required
                    disabled={isValidating}
                  />
                  <Radio size={14} className="input-icon" />
                </div>
                <span className="field-hint">Hardware chassis or telemetry transmitter ID</span>
              </div>

              <div className="form-group">
                <label htmlFor="mission-id">OPERATIONAL MISSION ID</label>
                <div className="input-wrapper">
                  <input
                    id="mission-id"
                    type="text"
                    value={missionId}
                    onChange={(e) => setMissionId(e.target.value.toUpperCase())}
                    placeholder="e.g. MI007"
                    required
                    disabled={isValidating}
                  />
                  <Compass size={14} className="input-icon" />
                </div>
                <span className="field-hint">Target mission coordinate and telemetry stream</span>
              </div>

              <button type="submit" className="initialize-btn" disabled={isValidating}>
                {isValidating ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    CONNECTING & VALIDATING…
                  </>
                ) : (
                  <>
                    <span>INITIALIZE TACTICAL CONSOLE</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Section B: Previous Missions */}
          <section className="entry-panel previous-missions-panel">
            <div className="panel-header">
              <span>
                <Layers size={13} />
                RECORDED MISSIONS // REGISTRY
              </span>
              <button
                type="button"
                className="refresh-missions-btn"
                onClick={loadMissions}
                title="Refresh Mission List"
              >
                <RefreshCw size={11} className={isLoadingMissions ? "spin" : ""} />
              </button>
            </div>

            <div className="previous-missions-list">
              {isLoadingMissions && previousMissions.length === 0 ? (
                <div className="entry-empty-state">
                  <RefreshCw size={18} className="spin" />
                  <span>QUERYING MISSION REGISTRY…</span>
                </div>
              ) : previousMissions.length === 0 ? (
                <div className="entry-empty-state">
                  <CheckCircle2 size={18} />
                  <span>NO PREVIOUS MISSIONS REGISTERED</span>
                </div>
              ) : (
                previousMissions.map((m) => (
                  <button
                    key={m.mission_id}
                    type="button"
                    className={`mission-card ${m.mission_id === missionId ? "is-active" : ""}`}
                    onClick={() => handleSelectPrevious(m)}
                  >
                    <div className="card-top">
                      <strong>{m.name}</strong>
                      <span className={`status-pill ${m.status.toLowerCase()}`}>
                        <i className="status-dot" />
                        {m.status}
                      </span>
                    </div>

                    <div className="card-details">
                      <div>
                        <small>MISSION</small>
                        <code>{m.mission_id}</code>
                      </div>
                      <div>
                        <small>ROBOT</small>
                        <code>{m.robot_id}</code>
                      </div>
                      <div>
                        <small>SECTOR</small>
                        <span>{m.sector}</span>
                      </div>
                      <div>
                        <small>STARTED</small>
                        <span>{formatTime(m.started_at)}</span>
                      </div>
                    </div>

                    <div className="card-action">
                      <span>LOAD MISSION</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>

        <footer className="entry-footer">
          <span>GUJCOST 26 // DISASTER RESPONSE PLATFORM</span>
          <span>PIXHAWK · OPENCV · YOLO AI · OPEN-METEO</span>
        </footer>
      </div>
    </div>
  );
}

