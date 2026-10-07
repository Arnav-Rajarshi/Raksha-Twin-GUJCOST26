import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { getDashboardSnapshot } from "@/services/Dashboard_Service";
import { Dashboard } from "@/pages/Dashboard";
import { MissionEntry } from "@/components/mission-entry/MissionEntry";
import type { DashboardSnapshot } from "@/models/dashboard";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

const searchSchema = z.object({
  robot: z.string().optional(),
  mission: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "RAKSHA-TWIN | Mission Control" },
      {
        name: "description",
        content: "Live aerial-ground disaster response mission monitoring console.",
      },
      { property: "og:title", content: "RAKSHA-TWIN Mission Control" },
      {
        property: "og:description",
        content: "Operational dashboard for hybrid aerial-ground disaster response.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedRobot = search.robot;
  const selectedMission = search.mission;

  useEffect(() => {
    if (selectedRobot && selectedMission) {
      fetchMissionData(selectedRobot, selectedMission);
    } else {
      setSnapshot(null);
      setLoadError(null);
    }
  }, [selectedRobot, selectedMission]);

  const fetchMissionData = async (robotId: string, missionId: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getDashboardSnapshot(robotId, missionId);
      setSnapshot(data);
    } catch (err: any) {
      console.error("Mission loading failed:", err);
      setLoadError(err?.message || `Failed to connect or load ${robotId} / ${missionId}`);
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMission = (robotId: string, missionId: string) => {
    navigate({
      search: {
        robot: robotId,
        mission: missionId,
      },
    });
  };

  const handleReturnToEntry = () => {
    navigate({
      search: {
        robot: undefined,
        mission: undefined,
      },
    });
    setSnapshot(null);
    setLoadError(null);
  };

  // If loading
  if (isLoading) {
    return (
      <div className="mission-loading-screen">
        <div className="loading-card">
          <RefreshCw size={28} className="spin text-primary" />
          <h2>CONNECTING TO TACTICAL NODE</h2>
          <p>
            Loading mission <code>{selectedMission}</code> on platform <code>{selectedRobot}</code>…
          </p>
        </div>
      </div>
    );
  }

  // If there's an error loading the mission
  if (loadError) {
    return (
      <div className="mission-error-screen">
        <div className="tactical-error-card">
          <div className="error-card-header">
            <AlertTriangle size={20} className="critical-text" />
            <h3>TACTICAL LINK FAILURE // INITIALIZATION ABORTED</h3>
          </div>
          <div className="error-card-body">
            <p>{loadError}</p>
            <div className="meta-row">
              <span>TARGET PLATFORM: {selectedRobot}</span>
              <span>MISSION ID: {selectedMission}</span>
            </div>
          </div>
          <div className="error-card-actions">
            <button
              type="button"
              className="retry-btn"
              onClick={() => selectedRobot && selectedMission && fetchMissionData(selectedRobot, selectedMission)}
            >
              <RefreshCw size={14} />
              RETRY CONNECTION
            </button>
            <button type="button" className="back-btn" onClick={handleReturnToEntry}>
              <ArrowLeft size={14} />
              CHANGE MISSION
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If mission is loaded, show full Tactical Dashboard
  if (snapshot) {
    return <Dashboard data={snapshot} onSwitchMission={handleReturnToEntry} />;
  }

  // Default: First-Entry Mission Selector Screen
  return (
    <MissionEntry
      initialRobotId={selectedRobot || "RAKSHA-01"}
      initialMissionId={selectedMission || "MISSION-001"}
      onSelectMission={handleSelectMission}
      errorMessage={loadError}
    />
  );
}
