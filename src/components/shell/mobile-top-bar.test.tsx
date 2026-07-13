import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { alertsMock, storeMock, setSubmenuMock, pushMock } = vi.hoisted(() => ({
  alertsMock: vi.fn(),
  storeMock: vi.fn(),
  setSubmenuMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/hooks/use-dashboard", () => ({
  useDashboardAlerts: (...args: unknown[]) => alertsMock(...args),
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
};

describe("MobileTopBar", () => {
  beforeEach(() => {
    alertsMock.mockReset();
    storeMock.mockReset();
    setSubmenuMock.mockReset();
    pushMock.mockReset();
    storeMock.mockReturnValue(baseStore);
  });

  it("renders the page title and a Settings link", () => {
    alertsMock.mockReturnValue({ data: [] });
    render(<MobileTopBar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/settings");
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
