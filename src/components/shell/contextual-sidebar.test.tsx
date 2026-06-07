import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resetToDefaultViewMock = vi.fn();
const loadReportMock = vi.fn();

const savedReportsState = {
  savedReports: [
    { id: "sr-1", name: "All - 2026", timeframe: "year" },
    { id: "sr-2", name: "Q1 2026 Overview", timeframe: "quarter" },
  ],
  saveCurrentReport: vi.fn(),
  loadReport: loadReportMock,
  activeSavedReport: null as string | null,
  resetToDefaultView: resetToDefaultViewMock,
};

vi.mock("@/hooks/use-reporting", () => ({
  useSavedReports: () => savedReportsState,
}));

type SidebarStore = {
  currentPage: string;
  openShoppingListPopup: () => void;
  reporting: { savedReportsOpen: boolean };
  toggleSavedReports: () => void;
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: SidebarStore) => unknown) =>
    selector({
      currentPage: "reporting",
      openShoppingListPopup: vi.fn(),
      reporting: { savedReportsOpen: true },
      toggleSavedReports: vi.fn(),
    }),
}));

// Stub the other sidebar sections so only the saved-reports block renders.
vi.mock("./sidebar-sections/actions-section", () => ({ ActionsSection: () => null }));
vi.mock("./sidebar-sections/channel-filter", () => ({ ChannelFilter: () => null }));
vi.mock("./sidebar-sections/listing-filter-tree", () => ({ ListingFilterTree: () => null }));
vi.mock("./sidebar-sections/settings-nav-section", () => ({ SettingsNavSection: () => null }));
vi.mock("./sidebar-sections/timeframe-selector", () => ({ TimeframeSelector: () => null }));
vi.mock("./sidebar-sections/view-switcher", () => ({ ViewSwitcher: () => null }));

import { ContextualSidebar } from "./contextual-sidebar";

describe("ContextualSidebar - saved reports (#6a/#6b)", () => {
  beforeEach(() => {
    resetToDefaultViewMock.mockReset();
    loadReportMock.mockReset();
    savedReportsState.activeSavedReport = null;
  });

  it("#6b highlights only the active saved report row", () => {
    savedReportsState.activeSavedReport = "sr-1";
    render(<ContextualSidebar />);
    expect(screen.getByRole("button", { name: "All - 2026" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Q1 2026 Overview" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("#6b highlights nothing when no report is active (default view)", () => {
    savedReportsState.activeSavedReport = null;
    render(<ContextualSidebar />);
    expect(screen.getByRole("button", { name: "All - 2026" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Q1 2026 Overview" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("#6a 'Show default' is disabled with no active report, enabled with one", () => {
    savedReportsState.activeSavedReport = null;
    const { rerender } = render(<ContextualSidebar />);
    expect(screen.getByRole("button", { name: "Show default" })).toBeDisabled();

    savedReportsState.activeSavedReport = "sr-1";
    rerender(<ContextualSidebar />);
    expect(screen.getByRole("button", { name: "Show default" })).toBeEnabled();
  });

  it("#6a clicking 'Show default' calls resetToDefaultView", async () => {
    savedReportsState.activeSavedReport = "sr-1";
    render(<ContextualSidebar />);
    await userEvent.click(screen.getByRole("button", { name: "Show default" }));
    expect(resetToDefaultViewMock).toHaveBeenCalledOnce();
  });
});
