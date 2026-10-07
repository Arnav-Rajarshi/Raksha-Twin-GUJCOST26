import { dashboardMock } from "@/mock-data/dashboard.mock";
export const getActiveAlerts = () => structuredClone(dashboardMock.alerts).filter((alert) => alert.status === "ACTIVE");