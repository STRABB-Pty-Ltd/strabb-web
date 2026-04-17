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
  setTimeframe: (page: TimeframePage, tf: string) => void;
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

    // Cross-cutting: set view for a viewable page
    setView: (page: ViewablePage, view: string) => {
      const pageState = { ...get()[page] };
      (pageState as Record<string, unknown>).view = view;
      set({ [page]: pageState } as Partial<AppState>);
    },

    // Cross-cutting: set timeframe for a timeframeable page
    setTimeframe: (page: TimeframePage, tf: string) => {
      const pageState = { ...get()[page] };
      (pageState as Record<string, unknown>).timeframe = tf;
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
