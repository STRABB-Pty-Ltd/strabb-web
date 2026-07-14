import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { storeMock, closeMobileNavDrawerMock, useSubmenuChipsMock, handleChipClickMock } =
  vi.hoisted(() => ({
    storeMock: vi.fn(),
    closeMobileNavDrawerMock: vi.fn(),
    useSubmenuChipsMock: vi.fn(),
    handleChipClickMock: vi.fn(),
  }));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector(storeMock()),
}));

vi.mock("@/hooks/use-submenu-chips", () => ({
  useSubmenuChips: () => useSubmenuChipsMock(),
}));

vi.mock("./submenu-left-slot", () => ({
  SubmenuLeftSlot: () => <div>left-slot</div>,
}));

vi.mock("./contextual-sidebar", () => ({
  ContextualSidebarSections: ({ collapsibleListingFilter }: { collapsibleListingFilter?: boolean }) => (
    <div>sections collapsible={String(!!collapsibleListingFilter)}</div>
  ),
}));

import { MobileNavDrawer } from "./mobile-nav-drawer";

const baseChips = [
  { id: "overview", label: "Overview", behavior: "single-default" as const, defaultActive: true },
  { id: "bookings", label: "Bookings", behavior: "exclusive" as const },
];

function setup(overrides: { currentPage?: string; open?: boolean } = {}) {
  storeMock.mockReturnValue({
    mobileNavDrawer: { open: overrides.open ?? true },
    closeMobileNavDrawer: closeMobileNavDrawerMock,
    currentPage: overrides.currentPage ?? "calendar",
  });
  useSubmenuChipsMock.mockReturnValue({
    chips: baseChips,
    isChipActive: (chip: { id: string }) => chip.id === "overview",
    handleChipClick: handleChipClickMock,
  });
}

describe("MobileNavDrawer", () => {
  beforeEach(() => {
    storeMock.mockReset();
    closeMobileNavDrawerMock.mockReset();
    useSubmenuChipsMock.mockReset();
    handleChipClickMock.mockReset();
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
});
