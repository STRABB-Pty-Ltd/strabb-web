import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  alertsMock,
  storeMock,
  setSubmenuMock,
  pushMock,
  isMobileMock,
  openMobileNavDrawerMock,
  closeMobileNavDrawerMock,
} = vi.hoisted(() => ({
  alertsMock: vi.fn(),
  storeMock: vi.fn(),
  setSubmenuMock: vi.fn(),
  pushMock: vi.fn(),
  isMobileMock: vi.fn(),
  openMobileNavDrawerMock: vi.fn(),
  closeMobileNavDrawerMock: vi.fn(),
}));

vi.mock("@/hooks/use-dashboard", () => ({
  useDashboardAlerts: (...args: unknown[]) => alertsMock(...args),
}));

vi.mock("@/hooks/use-responsive-view", () => ({
  useIsMobile: (...args: unknown[]) => isMobileMock(...args),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector(storeMock()),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { MobileTopBar } from "./mobile-top-bar";

const baseStore = {
  currentPage: "dashboard",
  selectedListings: [],
  setSubmenu: setSubmenuMock,
  mobileNavDrawer: { open: false },
  openMobileNavDrawer: openMobileNavDrawerMock,
  closeMobileNavDrawer: closeMobileNavDrawerMock,
};

describe("MobileTopBar", () => {
  beforeEach(() => {
    alertsMock.mockReset();
    storeMock.mockReset();
    setSubmenuMock.mockReset();
    pushMock.mockReset();
    isMobileMock.mockReset();
    openMobileNavDrawerMock.mockReset();
    closeMobileNavDrawerMock.mockReset();
    storeMock.mockReturnValue(baseStore);
    isMobileMock.mockReturnValue(true);
  });

  it("clicking the hamburger opens the mobile nav drawer when closed", async () => {
    alertsMock.mockReturnValue({ data: [] });
    render(<MobileTopBar />);
    const trigger = screen.getByRole("button", { name: /open menu/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    expect(openMobileNavDrawerMock).toHaveBeenCalledTimes(1);
    expect(closeMobileNavDrawerMock).not.toHaveBeenCalled();
  });

  it("clicking the hamburger closes the drawer when already open", async () => {
    alertsMock.mockReturnValue({ data: [] });
    storeMock.mockReturnValue({ ...baseStore, mobileNavDrawer: { open: true } });
    render(<MobileTopBar />);
    const trigger = screen.getByRole("button", { name: /open menu/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(trigger);
    expect(closeMobileNavDrawerMock).toHaveBeenCalledTimes(1);
    expect(openMobileNavDrawerMock).not.toHaveBeenCalled();
  });

  it("hides the hamburger on settings, where SettingsMobileNav owns mobile nav", () => {
    alertsMock.mockReturnValue({ data: [] });
    storeMock.mockReturnValue({ ...baseStore, currentPage: "settings" });
    render(<MobileTopBar />);
    expect(screen.queryByRole("button", { name: /open menu/i })).not.toBeInTheDocument();
  });

  it("renders the page title and a Settings link", () => {
    alertsMock.mockReturnValue({ data: [] });
    render(<MobileTopBar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/settings");
  });

  it("only enables the alerts query below lg, since this header is CSS-hidden (not unmounted) at lg+", () => {
    alertsMock.mockReturnValue({ data: [] });
    render(<MobileTopBar />);
    expect(alertsMock).toHaveBeenCalledWith([], true);

    isMobileMock.mockReturnValue(false);
    alertsMock.mockClear();
    render(<MobileTopBar />);
    expect(alertsMock).toHaveBeenCalledWith([], false);
  });

  it("folds the unread count into the notifications button's aria-label", () => {
    alertsMock.mockReturnValue({
      data: [
        { id: "a1", type: "message", severity: "blue", description: "1 unread message", count: 1 },
        { id: "a2", type: "ticket", severity: "red", description: "1 urgent ticket", count: 1 },
      ],
    });
    render(<MobileTopBar />);
    expect(screen.getByRole("button", { name: "Notifications, 2 unread" })).toBeInTheDocument();
  });

  it("shows no unread badge when there are no alerts", () => {
    alertsMock.mockReturnValue({ data: [] });
    const { container } = render(<MobileTopBar />);
    expect(container.querySelector('[style*="status-issues"]')).not.toBeInTheDocument();
  });

  it("shows an unread badge when alerts are present", () => {
    alertsMock.mockReturnValue({
      data: [
        { id: "a1", type: "message", severity: "blue", description: "1 unread message", count: 1 },
      ],
    });
    const { container } = render(<MobileTopBar />);
    expect(container.querySelector('[style*="status-issues"]')).toBeInTheDocument();
  });

  it("opens the notifications dropdown and lists alerts on click", async () => {
    alertsMock.mockReturnValue({
      data: [
        { id: "a1", type: "message", severity: "blue", description: "1 unread message", count: 1 },
      ],
    });
    render(<MobileTopBar />);
    expect(screen.queryByText("1 unread message")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByText("1 unread message")).toBeInTheDocument();
  });

  it("clicking the trigger again while open closes it, not close-then-reopen", async () => {
    alertsMock.mockReturnValue({
      data: [
        { id: "a1", type: "message", severity: "blue", description: "1 unread message", count: 1 },
      ],
    });
    render(<MobileTopBar />);
    const trigger = screen.getByRole("button", { name: /notifications/i });
    await userEvent.click(trigger);
    expect(screen.getByText("1 unread message")).toBeInTheDocument();
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.queryByText("1 unread message")).not.toBeInTheDocument());
  });

  it("shows an empty state when the dropdown is open with no alerts", async () => {
    alertsMock.mockReturnValue({ data: [] });
    render(<MobileTopBar />);
    await userEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByText(/no new alerts/i)).toBeInTheDocument();
  });

  it("clicking an alert's View button navigates and closes the dropdown", async () => {
    alertsMock.mockReturnValue({
      data: [
        { id: "a1", type: "message", severity: "blue", description: "1 unread message", count: 1 },
      ],
    });
    render(<MobileTopBar />);
    await userEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await userEvent.click(screen.getByRole("button", { name: /view/i }));
    expect(setSubmenuMock).toHaveBeenCalledWith("messaging", ["unread"]);
    expect(pushMock).toHaveBeenCalledWith("/messaging");
    // Dropdown plays a brief exit animation before unmounting (useDelayedClose).
    await waitFor(() => expect(screen.queryByText("1 unread message")).not.toBeInTheDocument());
  });
});
