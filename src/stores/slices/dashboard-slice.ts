import type { StateCreator } from "zustand";

import type { DrillDownState } from "../types";

export interface DashboardPageState {
  timeframe: string;
  submenu: string[];
  compare: boolean;
  moreOpen: boolean;
  drillDown: DrillDownState | null;
}

export interface DashboardSlice {
  dashboard: DashboardPageState;
  toggleCompare: () => void;
  setDrillDown: (item: DrillDownState) => void;
  clearDrillDown: () => void;
}

export const createDashboardSlice: StateCreator<
  DashboardSlice,
  [],
  [],
  DashboardSlice
> = (set, get) => ({
  dashboard: {
    timeframe: "this_month",
    submenu: ["overview"],
    compare: false,
    moreOpen: false,
    drillDown: null,
  },
  toggleCompare: () =>
    set({
      dashboard: { ...get().dashboard, compare: !get().dashboard.compare },
    }),
  setDrillDown: (item) =>
    set({ dashboard: { ...get().dashboard, drillDown: item } }),
  clearDrillDown: () =>
    set({ dashboard: { ...get().dashboard, drillDown: null } }),
});
