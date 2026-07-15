import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  storeMock,
  closeMobileNavDrawerMock,
  useSubmenuChipsMock,
  handleChipClickMock,
  isMobileMock,
} = vi.hoisted(() => ({
  storeMock: vi.fn(),
  closeMobileNavDrawerMock: vi.fn(),
  useSubmenuChipsMock: vi.fn(),
  handleChipClickMock: vi.fn(),
  isMobileMock: vi.fn(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector(storeMock()),
}));

vi.mock("@/hooks/use-submenu-chips", () => ({
  useSubmenuChips: () => useSubmenuChipsMock(),
}));

vi.mock("@/hooks/use-responsive-view", () => ({
  useIsMobile: (...args: unknown[]) => isMobileMock(...args),
}));

vi.mock("./submenu-left-slot", () => ({
  SubmenuLeftSlot: () => <div>left-slot</div>,
}));

const timeframePages = ["dashboard", "calendar", "operations", "reporting"];

vi.mock("./contextual-sidebar", () => ({
  showTimeframe: (page: string) => timeframePages.includes(page),
  ContextualSidebarSections: ({
    collapsibleListingFilter,
    renderAfterTimeframe,
  }: {
    collapsibleListingFilter?: boolean;
    renderAfterTimeframe?: ReactNode;
  }) => (
    <div>
      <span>sections collapsible={String(!!collapsibleListingFilter)}</span>
      {renderAfterTimeframe}
    </div>
  ),
}));

import { MobileNavDrawer } from "./mobile-nav-drawer";

const baseChips = [
  { id: "overview", label: "Overview", behavior: "single-default" as const, defaultActive: true },
  { id: "bookings", label: "Bookings", behavior: "exclusive" as const },
];

const chipsWithMore = [
  ...baseChips,
  { id: "compare", label: "Compare", behavior: "more-dropdown" as const },
];

function setup(
  overrides: {
    currentPage?: string;
    open?: boolean;
    chips?: typeof chipsWithMore;
    moreOpen?: boolean;
  } = {},
) {
  storeMock.mockReturnValue({
    mobileNavDrawer: { open: overrides.open ?? true },
    closeMobileNavDrawer: closeMobileNavDrawerMock,
    currentPage: overrides.currentPage ?? "calendar",
  });
  useSubmenuChipsMock.mockReturnValue({
    chips: overrides.chips ?? baseChips,
    isChipActive: (chip: { id: string }) => chip.id === "overview",
    handleChipClick: handleChipClickMock,
    moreOpen: overrides.moreOpen ?? false,
    moreRef: { current: null },
  });
}

describe("MobileNavDrawer", () => {
  beforeEach(() => {
    storeMock.mockReset();
    closeMobileNavDrawerMock.mockReset();
    useSubmenuChipsMock.mockReset();
    handleChipClickMock.mockReset();
    isMobileMock.mockReset();
    isMobileMock.mockReturnValue(true);
    setup();
  });

  it("renders null on settings, since SettingsMobileNav already owns that page", () => {
    setup({ currentPage: "settings" });
    const { container } = render(<MobileNavDrawer />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders chips above the left slot and sections, with the listing filter collapsible", () => {
    render(<MobileNavDrawer />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.getByText("left-slot")).toBeInTheDocument();
    expect(screen.getByText("sections collapsible=true")).toBeInTheDocument();
  });

  it("clicking a chip delegates to handleChipClick and closes the drawer", async () => {
    render(<MobileNavDrawer />);
    await userEvent.click(screen.getByText("Bookings"));

    expect(handleChipClickMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "bookings" }),
    );
    expect(closeMobileNavDrawerMock).toHaveBeenCalledTimes(1);
  });

  it("on a timeframe page, threads the left slot through the sections (below the timeframe picker), not up near the chips", () => {
    setup({ currentPage: "calendar" });
    render(<MobileNavDrawer />);

    // Exactly one instance - not duplicated between the top slot and the
    // sections-injected slot.
    expect(screen.getAllByText("left-slot")).toHaveLength(1);

    const leftSlot = screen.getByText("left-slot");
    const sections = screen.getByText("sections collapsible=true");
    // DOCUMENT_POSITION_FOLLOWING (4): sections comes before left-slot.
    expect(sections.compareDocumentPosition(leftSlot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("on a non-timeframe page (messaging), renders the left slot up near the chips instead", () => {
    setup({ currentPage: "messaging" });
    render(<MobileNavDrawer />);

    expect(screen.getAllByText("left-slot")).toHaveLength(1);

    const leftSlot = screen.getByText("left-slot");
    const sections = screen.getByText("sections collapsible=true");
    // DOCUMENT_POSITION_PRECEDING (2): sections comes after left-slot.
    expect(sections.compareDocumentPosition(leftSlot) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("closes itself when the viewport crosses to desktop while open, not just hides", () => {
    setup({ open: true });
    isMobileMock.mockReturnValue(false);
    render(<MobileNavDrawer />);
    expect(closeMobileNavDrawerMock).toHaveBeenCalledTimes(1);
  });

  it("does not call close when open but still mobile-width", () => {
    setup({ open: true });
    isMobileMock.mockReturnValue(true);
    render(<MobileNavDrawer />);
    expect(closeMobileNavDrawerMock).not.toHaveBeenCalled();
  });

  it("does not call close when already closed at desktop width", () => {
    setup({ open: false });
    isMobileMock.mockReturnValue(false);
    render(<MobileNavDrawer />);
    expect(closeMobileNavDrawerMock).not.toHaveBeenCalled();
  });

  it("a more-dropdown chip does not close the drawer, unlike every other chip", async () => {
    setup({ chips: chipsWithMore });
    render(<MobileNavDrawer />);
    await userEvent.click(screen.getByText("Compare"));

    expect(handleChipClickMock).toHaveBeenCalledWith(expect.objectContaining({ id: "compare" }));
    expect(closeMobileNavDrawerMock).not.toHaveBeenCalled();
  });

  it("shows a Coming soon note when the more-dropdown chip is open, matching desktop's affordance", () => {
    setup({ chips: chipsWithMore, moreOpen: true });
    render(<MobileNavDrawer />);

    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compare" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("hides the Coming soon note when the more-dropdown chip is closed", () => {
    setup({ chips: chipsWithMore, moreOpen: false });
    render(<MobileNavDrawer />);
    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();
  });

  it("does not self-close on Escape - useKeyboardShortcuts owns Escape for this drawer instead", async () => {
    render(<MobileNavDrawer />);
    await userEvent.keyboard("{Escape}");
    // If this were still true (Drawer's own default), a TimeframePopup/
    // SharePopup/ShoppingListPopup opened from inside the drawer would
    // close both itself and the drawer on a single Escape press.
    expect(closeMobileNavDrawerMock).not.toHaveBeenCalled();
  });
});
