import { useEffect, useState } from "react";
import type { RobotState } from "@/models/dashboard";
import { subscribeRobotTelemetry } from "@/services/RobotStatus_Service";

export function useRobotTelemetry(initial: RobotState) {
  const [state, setState] = useState(initial);
  useEffect(() => subscribeRobotTelemetry(setState), []);
  return state;
}
