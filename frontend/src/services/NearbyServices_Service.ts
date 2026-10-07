import { dashboardMock } from "@/mock-data/dashboard.mock";
export const getNearbyServices = () => structuredClone(dashboardMock.nearbyServices).sort((a, b) => a.distance_km - b.distance_km);