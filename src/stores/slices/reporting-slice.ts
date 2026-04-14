import type { StateCreator } from "zustand";

import type { SavedReport } from "../types";

export interface ReportingPageState {
  timeframe: string;
  submenu: string[];
  moreOpen: boolean;
  savedReportsOpen: boolean;
  activeSavedReport: string | null;
  savedReports: SavedReport[];
}

export interface ReportingSlice {
  reporting: ReportingPageState;
  toggleSavedReports: () => void;
  setActiveSavedReport: (id: string | null) => void;
  addSavedReport: (report: SavedReport) => void;
  deleteSavedReport: (id: string) => void;
}

export const createReportingSlice: StateCreator<
  ReportingSlice,
  [],
  [],
  ReportingSlice
> = (set, get) => ({
  reporting: {
    timeframe: "this_month",
    submenu: ["overview"],
    moreOpen: false,
    savedReportsOpen: false,
    activeSavedReport: null,
    savedReports: [],
  },
  toggleSavedReports: () =>
    set({
      reporting: {
        ...get().reporting,
        savedReportsOpen: !get().reporting.savedReportsOpen,
      },
    }),
  setActiveSavedReport: (id) =>
    set({ reporting: { ...get().reporting, activeSavedReport: id } }),
  addSavedReport: (report) =>
    set({
      reporting: {
        ...get().reporting,
        savedReports: [...get().reporting.savedReports, report],
      },
    }),
  deleteSavedReport: (id) =>
    set({
      reporting: {
        ...get().reporting,
        savedReports: get().reporting.savedReports.filter((r) => r.id !== id),
      },
    }),
});
