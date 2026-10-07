import { useEffect, useState } from "react";
import type { RobotState } from "@/models/dashboard";
import { subscribeRobotTelemetry } from "@/services/RobotStatus_Service";

export function useRobotTelemetry(initial: RobotState) {
  const [state, setState] = useState<RobotState>(initial);

  useEffect(() => {
    setState(initial);
  }, [initial]);

  useEffect(() => {
    const unsubscribe = subscribeRobotTelemetry(
      setState,
      2000,
      initial.robot_id,
      initial.mission_id
    );

    return unsubscribe;
  }, [initial.robot_id, initial.mission_id]);

  return state;
}