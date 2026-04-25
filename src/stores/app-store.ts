import { create } from "zustand";

import { type CalendarSlice, createCalendarSlice } from "./slices/calendar-slice";
import { type CleaningSlice, createCleaningSlice } from "./slices/cleaning-slice";
import { type DashboardSlice, createDashboardSlice } from "./slices/dashboard-slice";
import { type ListingsSlice, createListingsSlice } from "./slices/listings-slice";
import { type MessagingSlice, createMessagingSlice } from "./slices/messaging-slice";
import { type NavigationSlice, createNavigationSlice } from "./slices/navigation-slice";
import { type OverlaySlice, createOverlaySlice } from "./slices/overlay-slice";
import { type ReportingSlice, createReportingSlice } from "./slices/reporting-slice";
import { type SettingsSlice, createSettingsSlice } from "./slices/settings-slice";

// Pages that support a view switcher
type ViewablePage = "calendar" | "messaging" | "cleaning";

// Pages that support a timeframe
type TimeframePage = "dashboard" | "calendar" | "cleaning" | "reporting";

// Pages that support submenu chips
type SubmenuPage = "dashboard" | "calendar" | "messaging" | "cleaning" | "reporting";

export interface CrossCuttingActions {
  setView: (page: ViewablePage, view: string) => void;
  setTimeframe: (page: TimeframePage, windowSize: string, anchor?: string | null) => void;
  setTimeframeAnchor: (page: TimeframePage, anchor: string | null) => void;
  toggleSubmenuChip: (page: SubmenuPage, chip: string) => void;
  setSubmenu: (page: SubmenuPage, chips: string[]) => void;
}

export type AppState = NavigationSlice &
  ListingsSlice &
  DashboardSlice &
  CalendarSlice &
  MessagingSlice &
  CleaningSlice &
  ReportingSlice &
  SettingsSlice &
  OverlaySlice &
  CrossCuttingActions;

export const useAppStore = create<AppState>()((...a) => {
  const [set, get] = a;
  return {
    ...createNavigationSlice(...a),
    ...createListingsSlice(...a),
    ...createDashboardSlice(...a),
    ...createCalendarSlice(...a),
    ...createMessagingSlice(...a),
    ...createCleaningSlice(...a),
    ...createReportingSlice(...a),
    ...createSettingsSlice(...a),
    ...createOverlaySlice(...a),

    // Cross-cutting: set view for a viewable page. Switching to gantt on
    // calendar/cleaning auto-defaults the windowSize to fortnight — gantt is
    // most useful at a fortnight zoom and the user can override via the chip.
    setView: (page: ViewablePage, view: string) => {
      const pageState = { ...get()[page] };
      (pageState as Record<string, unknown>).view = view;
      if (view === "gantt" && (page === "calendar" || page === "cleaning")) {
        (pageState as Record<string, unknown>).windowSize = "fortnight";
      }
      set({ [page]: pageState } as Partial<AppState>);
    },

    // Cross-cutting: set timeframe window size (and reset anchor by default)
    setTimeframe: (page: TimeframePage, windowSize: string, anchor: string | null = null) => {
      const pageState = { ...get()[page] };
      (pageState as Record<string, unknown>).windowSize = windowSize;
      (pageState as Record<string, unknown>).anchor = anchor;
      set({ [page]: pageState } as Partial<AppState>);
    },

    // Cross-cutting: update only the anchor (e.g. popup picks a different period)
    setTimeframeAnchor: (page: TimeframePage, anchor: string | null) => {
      const pageState = { ...get()[page] };
      (pageState as Record<string, unknown>).anchor = anchor;
      set({ [page]: pageState } as Partial<AppState>);
    },

    // Cross-cutting: toggle a submenu chip for a page
    toggleSubmenuChip: (page: SubmenuPage, chip: string) => {
      const pageState = { ...get()[page] };
      const current = (pageState as { submenu: string[] }).submenu;
      (pageState as { submenu: string[] }).submenu = current.includes(chip)
        ? current.filter((c: string) => c !== chip)
        : [...current, chip];
      set({ [page]: pageState } as Partial<AppState>);
    },

    // Cross-cutting: replace submenu chips for a page
    setSubmenu: (page: SubmenuPage, chips: string[]) => {
      const pageState = { ...get()[page] };
      (pageState as { submenu: string[] }).submenu = chips;
      set({ [page]: pageState } as Partial<AppState>);
    },
  };
});
