import { create } from "zustand";
import type { DashboardSnapshot } from "@/models/dashboard";

interface DashboardStore {
  snapshot: DashboardSnapshot | null;
  selectedLayer: "satellite" | "terrain";
  selectedServiceId: string | null;
  setSnapshot: (snapshot: DashboardSnapshot) => void;
  setSelectedServiceId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  snapshot: null,
  selectedLayer: "satellite",
  selectedServiceId: null,
  setSnapshot: (snapshot) => set({ snapshot }),
  setSelectedServiceId: (selectedServiceId) => set({ selectedServiceId }),
}));