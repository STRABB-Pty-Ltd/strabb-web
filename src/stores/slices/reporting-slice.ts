import type { StateCreator } from "zustand";

export interface ReportingPageState {
  windowSize: string;
  anchor: string | null;
  submenu: string[];
  moreOpen: boolean;
  savedReportsOpen: boolean;
  activeSavedReport: string | null;
}

export interface ReportingSlice {
  reporting: ReportingPageState;
  toggleSavedReports: () => void;
  setActiveSavedReport: (id: string | null) => void;
}

export const createReportingSlice: StateCreator<ReportingSlice, [], [], ReportingSlice> = (
  set,
  get,
) => ({
  reporting: {
    windowSize: "month",
    anchor: null,
    submenu: ["overview"],
    moreOpen: false,
    savedReportsOpen: false,
    activeSavedReport: null,
  },
  toggleSavedReports: () =>
    set({
      reporting: {
        ...get().reporting,
        savedReportsOpen: !get().reporting.savedReportsOpen,
      },
    }),
  setActiveSavedReport: (id) => set({ reporting: { ...get().reporting, activeSavedReport: id } }),
});
