import { dashboardMock } from "@/mock-data/dashboard.mock";
export const getMissionEvents = () => structuredClone(dashboardMock.events).sort((a, b) => b.timestamp.localeCompare(a.timestamp));