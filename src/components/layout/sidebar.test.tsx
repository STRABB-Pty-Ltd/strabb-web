import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { navItems } from "@/lib/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

import { Sidebar } from "./sidebar";

describe("Sidebar", () => {
  it("renders all navigation links", () => {
    render(<Sidebar />);

    for (const item of navItems) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it("renders links with correct hrefs", () => {
    render(<Sidebar />);

    for (const item of navItems) {
      const link = screen.getByText(item.label).closest("a");
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("highlights the active link", () => {
    render(<Sidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).toContain("bg-primary");

    const propertiesLink = screen.getByText("Properties").closest("a");
    expect(propertiesLink?.className).not.toContain("bg-primary");
  });
});
