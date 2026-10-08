import { dashboardMock } from "@/mock-data/dashboard.mock";
import type { PiDetectionState } from "@/models/dashboard";

const RAKSHA_ML_BASE_URL =
  (import.meta.env["VITE_RAKSHA_ML_URL"] as string | undefined)?.trim().replace(/\/+$/, "") ||
  "http://192.168.111.27:8001";
const LOCAL_ML_BASE_URL =
  (import.meta.env["VITE_RAKSHA_LOCAL_ML_URL"] as string | undefined)?.trim().replace(/\/+$/, "") ||
  "http://127.0.0.1:8002";

export const RAKSHA_ML_VIDEO_URL = `${RAKSHA_ML_BASE_URL}/video`;
export const LOCAL_ML_VIDEO_URL = `${LOCAL_ML_BASE_URL}/video`;

export const getCameraFeed = () => structuredClone(dashboardMock.camera);

export async function getPiDetections(signal?: AbortSignal): Promise<PiDetectionState> {
  const response = await fetch(`${RAKSHA_ML_BASE_URL}/detections`, signal ? { signal } : undefined);
  if (!response.ok) throw new Error(`Pi detections request failed (${response.status})`);
  return response.json() as Promise<PiDetectionState>;
}

export async function getLocalDetections(signal?: AbortSignal): Promise<PiDetectionState> {
  const response = await fetch(`${LOCAL_ML_BASE_URL}/detections`, signal ? { signal } : undefined);
  if (!response.ok) throw new Error(`Local ML detections request failed (${response.status})`);
  return response.json() as Promise<PiDetectionState>;
}
