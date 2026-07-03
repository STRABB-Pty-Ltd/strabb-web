import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathnameMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

import { PortalNav, PortalTopNav } from "./portal-nav";

const DESTINATIONS = [
  ["Tasks", "/portal"],
  ["Availability", "/portal/availability"],
  ["Account", "/portal/account"],
] as const;

describe("portal navigation (responsive)", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
    pathnameMock.mockReturnValue("/portal");
  });

  it("bottom bar renders all three destinations and is hidden at md+", () => {
    const { container } = render(<PortalNav />);
    const nav = screen.getByRole("navigation", { name: "Portal" });
    expect(nav.className).toContain("md:hidden");
    for (const [label, href] of DESTINATIONS) {
      expect(within(nav).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
    expect(container).toBeTruthy();
  });

  it("top nav renders all three destinations and only shows at md+", () => {
    const { container } = render(<PortalTopNav />);
    const nav = within(container).getByRole("navigation", { name: "Portal" });
    expect(nav.className).toContain("hidden");
    expect(nav.className).toContain("md:flex");
    for (const [label, href] of DESTINATIONS) {
      expect(within(nav).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("marks the current destination active in both variants", () => {
    pathnameMock.mockReturnValue("/portal/availability");
    const { rerender } = render(<PortalTopNav />);
    expect(screen.getByRole("link", { name: "Availability" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Tasks" })).not.toHaveAttribute("aria-current");

    rerender(<PortalNav />);
    expect(screen.getByRole("link", { name: "Availability" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("Tasks stays active on a task detail route", () => {
    pathnameMock.mockReturnValue("/portal/tasks/abc-123");
    render(<PortalTopNav />);
    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute("aria-current", "page");
  });
});
