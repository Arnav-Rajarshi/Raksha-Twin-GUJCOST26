import { useEffect, useState } from "react";
import type { RobotState } from "@/models/dashboard";
import { subscribeRobotTelemetry } from "@/services/RobotStatus_Service";

export function useRobotTelemetry(initial: RobotState) {
  const [state, setState] = useState<RobotState>(initial);

  useEffect(() => {
    const unsubscribe = subscribeRobotTelemetry(setState);

    return unsubscribe;
  }, []);

  return state;
}