import type { StateCreator } from "zustand";

import type { DrillDownState } from "../types";

export interface DashboardPageState {
  windowSize: string;
  anchor: string | null;
  submenu: string[];
  moreOpen: boolean;
  drillDown: DrillDownState | null;
}

export interface DashboardSlice {
  dashboard: DashboardPageState;
  setDrillDown: (item: DrillDownState) => void;
  clearDrillDown: () => void;
}

export const createDashboardSlice: StateCreator<DashboardSlice, [], [], DashboardSlice> = (
  set,
  get,
) => ({
  dashboard: {
    windowSize: "month",
    anchor: null,
    submenu: ["overview"],
    moreOpen: false,
    drillDown: null,
  },
  setDrillDown: (item) => set({ dashboard: { ...get().dashboard, drillDown: item } }),
  clearDrillDown: () => set({ dashboard: { ...get().dashboard, drillDown: null } }),
});
