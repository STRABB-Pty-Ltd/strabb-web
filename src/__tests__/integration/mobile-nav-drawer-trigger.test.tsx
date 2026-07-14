import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "@/stores/app-store";

// The hamburger button (MobileTopBar) and the drawer it toggles
// (MobileNavDrawer) are separate components joined only through the store -
// exactly the shape that let the real bug through: the drawer's own
// useClickOutside doesn't know about a trigger living outside its panel DOM,
// so a component-level test of either piece alone (mocking the other side)
// can't reproduce the mousedown-before-click race. Only rendering both for
// real, with the real useClickOutside listener, catches it.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/calendar",
}));

vi.mock("@/hooks/use-dashboard", () => ({
  useDashboardAlerts: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-responsive-view", () => ({
  useIsMobile: () => true,
}));

// Real content (filter tree, saved reports, etc.) needs API data / a
// QueryClient - not what this test is about. Keep the real
// useSubmenuChips/Drawer/useClickOutside; stub only the section content.
vi.mock("@/components/shell/contextual-sidebar", () => ({
  showTimeframe: (page: string) =>
    ["dashboard", "calendar", "operations", "reporting"].includes(page),
  ContextualSidebarSections: () => <div>sections</div>,
}));

const { MobileTopBar } = await import("@/components/shell/mobile-top-bar");
const { MobileNavDrawer } = await import("@/components/shell/mobile-nav-drawer");

describe("Mobile nav drawer hamburger toggle (M.3)", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
    useAppStore.getState().setCurrentPage("calendar");
  });

  it("opens on the first click and closes on the second, not close-then-reopen", async () => {
    const user = userEvent.setup();
    render(
      <>
        <MobileTopBar />
        <MobileNavDrawer />
      </>,
    );

    const trigger = screen.getByRole("button", { name: "Open menu" });
    expect(screen.queryByRole("dialog", { name: "Calendar" })).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Calendar" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Panel stays mounted briefly for the exit keyframe (useDelayedClose).
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Calendar" })).not.toBeInTheDocument(),
    );
  });
});
