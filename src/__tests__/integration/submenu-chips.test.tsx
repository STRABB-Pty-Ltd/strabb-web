import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "@/stores/app-store";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

const { SubmenuBar } = await import("@/components/shell/submenu-bar");

describe("Submenu chip integration", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  describe("single-default behavior (Overview)", () => {
    it("clicking Overview resets submenu to [overview]", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("calendar");
      useAppStore.getState().setSubmenu("calendar", ["bookings", "cleaning"]);

      render(<SubmenuBar />);
      await user.click(screen.getByText("Overview"));

      expect(useAppStore.getState().calendar.submenu).toEqual(["overview"]);
    });
  });

  describe("toggle behavior (Compare)", () => {
    it("clicking Compare activates it independently", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("dashboard");

      render(<SubmenuBar />);
      expect(useAppStore.getState().dashboard.compare).toBe(false);

      await user.click(screen.getByText("Compare"));
      expect(useAppStore.getState().dashboard.compare).toBe(true);
    });

    it("clicking Compare again deactivates it", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("dashboard");
      useAppStore.getState().toggleCompare(); // activate first

      render(<SubmenuBar />);
      await user.click(screen.getByText("Compare"));
      expect(useAppStore.getState().dashboard.compare).toBe(false);
    });
  });

  describe("multi behavior (Calendar Bookings)", () => {
    it("clicking a multi chip adds it to active set", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("calendar");

      render(<SubmenuBar />);
      await user.click(screen.getByText("Bookings"));

      const submenu = useAppStore.getState().calendar.submenu;
      expect(submenu).toContain("bookings");
      expect(submenu).not.toContain("overview");
    });

    it("clicking multiple multi chips accumulates them", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("calendar");

      render(<SubmenuBar />);
      await user.click(screen.getByText("Bookings"));
      await user.click(screen.getByText("Vacancy"));

      const submenu = useAppStore.getState().calendar.submenu;
      expect(submenu).toContain("bookings");
      expect(submenu).toContain("vacancy");
    });

    it("removing last multi chip reverts to overview", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("calendar");
      useAppStore.getState().setSubmenu("calendar", ["bookings"]);

      render(<SubmenuBar />);
      await user.click(screen.getByText("Bookings"));

      expect(useAppStore.getState().calendar.submenu).toEqual(["overview"]);
    });
  });

  describe("exclusive behavior (Messaging Archived)", () => {
    it("selecting exclusive chip deselects others", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("messaging");
      useAppStore.getState().setSubmenu("messaging", ["unread"]);

      render(<SubmenuBar />);
      await user.click(screen.getByText("Archived"));

      const submenu = useAppStore.getState().messaging.submenu;
      expect(submenu).toEqual(["archived"]);
    });

    it("deselecting exclusive chip reverts to overview", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("messaging");
      useAppStore.getState().setSubmenu("messaging", ["archived"]);

      render(<SubmenuBar />);
      await user.click(screen.getByText("Archived"));

      expect(useAppStore.getState().messaging.submenu).toEqual(["overview"]);
    });
  });

  describe("messaging chips default to list view", () => {
    it("clicking Unread switches messaging view to list", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("messaging");
      expect(useAppStore.getState().messaging.view).toBe("kanban");

      render(<SubmenuBar />);
      await user.click(screen.getByText("Unread"));

      expect(useAppStore.getState().messaging.view).toBe("list");
    });

    it("clicking Archived switches messaging view to list", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("messaging");

      render(<SubmenuBar />);
      await user.click(screen.getByText("Archived"));

      expect(useAppStore.getState().messaging.view).toBe("list");
    });

    it("clicking Overview switches messaging view back to kanban", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("messaging");
      useAppStore.getState().setSubmenu("messaging", ["unread"]);
      useAppStore.getState().setView("messaging", "list");

      render(<SubmenuBar />);
      await user.click(screen.getByText("Overview"));

      expect(useAppStore.getState().messaging.view).toBe("kanban");
    });
  });

  describe("chip state persistence within session", () => {
    it("submenu state persists in store across page changes", () => {
      // Set calendar submenu
      useAppStore.getState().setCurrentPage("calendar");
      useAppStore.getState().setSubmenu("calendar", ["bookings", "vacancy"]);

      // Navigate away
      useAppStore.getState().setCurrentPage("messaging");

      // Navigate back
      useAppStore.getState().setCurrentPage("calendar");

      // Submenu should still be the same
      expect(useAppStore.getState().calendar.submenu).toEqual(["bookings", "vacancy"]);
    });
  });

  describe("SubmenuBar hides on settings page", () => {
    it("renders nothing when currentPage is settings", () => {
      useAppStore.getState().setCurrentPage("settings");
      const { container } = render(<SubmenuBar />);
      expect(container.innerHTML).toBe("");
    });
  });
});
