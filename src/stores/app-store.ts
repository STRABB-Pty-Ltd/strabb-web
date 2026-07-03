import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { type CalendarSlice, createCalendarSlice } from "./slices/calendar-slice";
import { type OperationsSlice, createOperationsSlice } from "./slices/operations-slice";
import { type DashboardSlice, createDashboardSlice } from "./slices/dashboard-slice";
import { type ListingsSlice, createListingsSlice } from "./slices/listings-slice";
import { type MessagingSlice, createMessagingSlice } from "./slices/messaging-slice";
import { type NavigationSlice, createNavigationSlice } from "./slices/navigation-slice";
import { type OverlaySlice, createOverlaySlice } from "./slices/overlay-slice";
import { type ReportingSlice, createReportingSlice } from "./slices/reporting-slice";
import { type SettingsSlice, createSettingsSlice } from "./slices/settings-slice";

// Pages that support a view switcher
type ViewablePage = "calendar" | "messaging" | "operations";

// Pages that support a timeframe
type TimeframePage = "dashboard" | "calendar" | "operations" | "reporting";

// Pages that support submenu chips
type SubmenuPage = "dashboard" | "calendar" | "messaging" | "operations" | "reporting";

// Default windowSize applied when switching to (page, view). Views absent
// from this map preserve whatever windowSize the page was already on.
const viewDefaultWindowSize: Record<string, Record<string, string>> = {
  calendar: { gantt: "fortnight", calendar: "month" },
  operations: { calendar: "month" },
};

// Default view per page when freshly entered (Overview chip). Pages
// without a view picker (dashboard, reporting) are absent.
const pageDefaultView: Partial<Record<ViewablePage, string>> = {
  calendar: "gantt",
  messaging: "kanban",
  operations: "kanban",
};

export interface CrossCuttingActions {
  setView: (page: ViewablePage, view: string) => void;
  setTimeframe: (page: TimeframePage, windowSize: string, anchor?: string | null) => void;
  setTimeframeAnchor: (page: TimeframePage, anchor: string | null) => void;
  toggleSubmenuChip: (page: SubmenuPage, chip: string) => void;
  setSubmenu: (page: SubmenuPage, chips: string[]) => void;
  /**
   * Reset a page's submenu (back to ["overview"]) and view (back to its
   * pageDefaultView entry). Called from the app shell on every top-level
   * page change so each entry feels fresh.
   */
  resetPageDefaults: (page: SubmenuPage) => void;
}

export type AppState = NavigationSlice &
  ListingsSlice &
  DashboardSlice &
  CalendarSlice &
  MessagingSlice &
  OperationsSlice &
  ReportingSlice &
  SettingsSlice &
  OverlaySlice &
  CrossCuttingActions;

// Only the user's filter/timeframe *selections* are persisted - never
// transient UI (open popups, toasts, in-flight drawers) or currentPage (the
// URL owns that). This is what makes a listing filter + a picked reporting
// period survive a full reload / Cloudflare-Access re-auth on QA instead of
// silently snapping back to "current month / all listings" (the empty-report
// bug: every /reporting/* call was going out with default state).
type PersistedTimeframe = { windowSize: string; anchor: string | null };
interface PersistedState {
  selectedListings: string[];
  expandedGroups: Record<string, boolean>;
  customGroups: AppState["customGroups"];
  customRange: AppState["customRange"];
  dashboard: PersistedTimeframe;
  calendar: PersistedTimeframe;
  operations: PersistedTimeframe;
  reporting: PersistedTimeframe & { submenu: string[] };
}

// localStorage is undefined during SSR of these "use client" pages; fall back
// to a no-op so the store module can load on the server without throwing.
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAppStore = create<AppState>()(
  persist(
    (...a) => {
      const [set, get] = a;
      return {
        ...createNavigationSlice(...a),
        ...createListingsSlice(...a),
        ...createDashboardSlice(...a),
        ...createCalendarSlice(...a),
        ...createMessagingSlice(...a),
        ...createOperationsSlice(...a),
        ...createReportingSlice(...a),
        ...createSettingsSlice(...a),
        ...createOverlaySlice(...a),

        // Cross-cutting: set view for a viewable page. Switching to a view that
        // has a configured default timeframe re-anchors the page's windowSize so
        // each view opens at the zoom level it's most useful at; views without an
        // entry preserve the user's current windowSize choice. Anchor resets to
        // null so the page snaps back to "current period" on the new window.
        setView: (page: ViewablePage, view: string) => {
          const pageState = { ...get()[page] };
          (pageState as Record<string, unknown>).view = view;
          const defaultWindow = viewDefaultWindowSize[page]?.[view];
          if (defaultWindow) {
            (pageState as Record<string, unknown>).windowSize = defaultWindow;
            (pageState as Record<string, unknown>).anchor = null;
          }
          set({ [page]: pageState } as Partial<AppState>);
        },

        // Cross-cutting: set timeframe window size (and reset anchor by default)
        setTimeframe: (page: TimeframePage, windowSize: string, anchor: string | null = null) => {
          const pageState = { ...get()[page] };
          (pageState as Record<string, unknown>).windowSize = windowSize;
          (pageState as Record<string, unknown>).anchor = anchor;
          // A manual reporting timeframe (granularity) change diverges from any loaded
          // saved-report preset, so clear the active highlight. loadReport calls
          // setActiveSavedReport after this, so a programmatic load keeps its highlight.
          if (page === "reporting") (pageState as Record<string, unknown>).activeSavedReport = null;
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
          // Manual chip change diverges from a loaded preset (see setTimeframe).
          if (page === "reporting") (pageState as Record<string, unknown>).activeSavedReport = null;
          set({ [page]: pageState } as Partial<AppState>);
        },

        // Cross-cutting: replace submenu chips for a page
        setSubmenu: (page: SubmenuPage, chips: string[]) => {
          const pageState = { ...get()[page] };
          (pageState as { submenu: string[] }).submenu = chips;
          // Manual submenu change diverges from a loaded preset (see setTimeframe).
          // loadReport / resetToDefaultView call setActiveSavedReport after this.
          if (page === "reporting") (pageState as Record<string, unknown>).activeSavedReport = null;
          set({ [page]: pageState } as Partial<AppState>);
        },

        // Cross-cutting: reset chip + view to defaults for a page.
        resetPageDefaults: (page: SubmenuPage) => {
          const pageState = { ...get()[page] } as Record<string, unknown>;
          pageState.submenu = ["overview"];
          const defaultView = pageDefaultView[page as ViewablePage];
          if (defaultView) pageState.view = defaultView;
          set({ [page]: pageState } as Partial<AppState>);
        },
      };
    },
    {
      name: "strabb-app-store",
      version: 1,
      storage: createJSONStorage<PersistedState>(() => {
        const ls = typeof window !== "undefined" ? window.localStorage : undefined;
        return ls ?? noopStorage;
      }),
      // Client-only rehydrate (see app-shell) so the server-rendered HTML and
      // the client's first paint both start from defaults - no hydration
      // mismatch - then the persisted selections load in on mount.
      skipHydration: true,
      partialize: (s): PersistedState => ({
        selectedListings: s.selectedListings,
        expandedGroups: s.expandedGroups,
        customGroups: s.customGroups,
        customRange: s.customRange,
        dashboard: { windowSize: s.dashboard.windowSize, anchor: s.dashboard.anchor },
        calendar: { windowSize: s.calendar.windowSize, anchor: s.calendar.anchor },
        operations: { windowSize: s.operations.windowSize, anchor: s.operations.anchor },
        reporting: {
          windowSize: s.reporting.windowSize,
          anchor: s.reporting.anchor,
          submenu: s.reporting.submenu,
        },
      }),
      // Default persist merge is a shallow spread, which would REPLACE each
      // whole page object with the persisted partial and drop the non-persisted
      // fields (view, moreOpen, savedReportsOpen, activeSavedReport...). Merge
      // each page one level deep so only the persisted timeframe fields load in.
      merge: (persisted, current): AppState => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return {
          ...current,
          ...(p.selectedListings ? { selectedListings: p.selectedListings } : {}),
          ...(p.expandedGroups ? { expandedGroups: p.expandedGroups } : {}),
          ...(p.customGroups ? { customGroups: p.customGroups } : {}),
          ...("customRange" in p ? { customRange: p.customRange ?? null } : {}),
          dashboard: { ...current.dashboard, ...(p.dashboard ?? {}) },
          calendar: { ...current.calendar, ...(p.calendar ?? {}) },
          operations: { ...current.operations, ...(p.operations ?? {}) },
          reporting: { ...current.reporting, ...(p.reporting ?? {}) },
        };
      },
    },
  ),
);
