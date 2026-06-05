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

  describe("coming-soon dropdown behavior (Compare)", () => {
    it("clicking Compare opens a 'Coming soon' dropdown and leaves the canvas alone", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("dashboard");

      render(<SubmenuBar />);
      // Hidden until the chip is opened.
      expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();

      await user.click(screen.getByText("Compare"));

      expect(screen.getByText("Coming soon")).toBeInTheDocument();
    });
  });

  describe("exclusive behavior (Calendar Bookings)", () => {
    it("clicking an exclusive chip replaces the active set", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("calendar");

      render(<SubmenuBar />);
      await user.click(screen.getByText("Bookings"));

      expect(useAppStore.getState().calendar.submenu).toEqual(["bookings"]);
    });

    it("clicking a different exclusive chip swaps - never accumulates", async () => {
      const user = userEvent.setup();
      useAppStore.getState().setCurrentPage("calendar");

      render(<SubmenuBar />);
      await user.click(screen.getByText("Bookings"));
      await user.click(screen.getByText("Vacancy"));

      expect(useAppStore.getState().calendar.submenu).toEqual(["vacancy"]);
    });

    it("clicking the active exclusive chip reverts to overview", async () => {
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
