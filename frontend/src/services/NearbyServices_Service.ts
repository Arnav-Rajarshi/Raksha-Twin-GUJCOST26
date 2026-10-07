import type { NearbyService } from "@/models/dashboard";
import { apiFetch } from "./apiClient";

export async function getNearbyServices(): Promise<NearbyService[]> {
  return apiFetch<NearbyService[]>("/nearby-services");
}