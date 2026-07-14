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

const { sidebarStore } = vi.hoisted(() => ({
  sidebarStore: {
    currentPage: "reporting",
    openShoppingListPopup: vi.fn(),
    reporting: { savedReportsOpen: true },
    toggleSavedReports: vi.fn(),
  } as SidebarStore,
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: SidebarStore) => unknown) => selector(sidebarStore),
}));

// Stub the other sidebar sections so only the saved-reports block renders.
vi.mock("./sidebar-sections/actions-section", () => ({ ActionsSection: () => null }));
vi.mock("./sidebar-sections/channel-filter", () => ({ ChannelFilter: () => null }));
vi.mock("./sidebar-sections/listing-filter-tree", () => ({
  ListingFilterTree: () => <div>listing-filter-tree</div>,
}));
vi.mock("./sidebar-sections/settings-nav-section", () => ({ SettingsNavSection: () => null }));
vi.mock("./sidebar-sections/timeframe-selector", () => ({ TimeframeSelector: () => null }));
vi.mock("./sidebar-sections/view-switcher", () => ({ ViewSwitcher: () => null }));

import { ContextualSidebar, ContextualSidebarSections } from "./contextual-sidebar";

describe("ContextualSidebar - saved reports (#6a/#6b)", () => {
  beforeEach(() => {
    resetToDefaultViewMock.mockReset();
    loadReportMock.mockReset();
    savedReportsState.activeSavedReport = null;
    sidebarStore.currentPage = "reporting";
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

describe("ContextualSidebarSections - collapsibleListingFilter (M.3)", () => {
  beforeEach(() => {
    sidebarStore.currentPage = "dashboard";
  });

  it("renders ListingFilterTree directly (uncollapsed) by default, matching desktop", () => {
    render(<ContextualSidebarSections />);
    expect(screen.getByText("listing-filter-tree")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Listings" })).not.toBeInTheDocument();
  });

  it("wraps it in a disclosure, collapsed by default, when opted in", () => {
    render(<ContextualSidebarSections collapsibleListingFilter />);
    const toggle = screen.getByRole("button", { name: "Listings" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Lazy-mounted: not just hidden, absent from the tree until expanded.
    expect(screen.queryByText("listing-filter-tree")).not.toBeInTheDocument();
  });

  it("expands the disclosure and mounts the tree on click", async () => {
    render(<ContextualSidebarSections collapsibleListingFilter />);
    await userEvent.click(screen.getByRole("button", { name: "Listings" }));

    expect(screen.getByRole("button", { name: "Listings" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("listing-filter-tree")).toBeInTheDocument();
  });

  it("renders no listing filter section on settings, collapsible or not", () => {
    sidebarStore.currentPage = "settings";
    render(<ContextualSidebarSections collapsibleListingFilter />);
    expect(screen.queryByRole("button", { name: "Listings" })).not.toBeInTheDocument();
    expect(screen.queryByText("listing-filter-tree")).not.toBeInTheDocument();
  });
});
