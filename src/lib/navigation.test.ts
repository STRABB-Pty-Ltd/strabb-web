import { describe, expect, it } from "vitest";

import { isNavItemVisible, settingsNavItem, topNavItems, type TopNavItem } from "./navigation";
import type { UserRole } from "@/types/auth";

// The visible top-nav id set for a role, plus whether Settings shows. This is
// the exact contract B.3 promises: cleaner loses Dashboard, Reporting, Settings;
// owner and admin keep everything.
function visibleTopNavIds(role: UserRole | null): string[] {
  return topNavItems.filter((item) => isNavItemVisible(item, role)).map((item) => item.id);
}

describe("isNavItemVisible", () => {
  it("shows an item with no roles to every role and to a null (loading) role", () => {
    const openItem: TopNavItem = topNavItems.find((i) => i.id === "operations")!;
    expect(openItem.roles).toBeUndefined();
    for (const role of ["owner", "admin", "cleaner", null] as const) {
      expect(isNavItemVisible(openItem, role)).toBe(true);
    }
  });

  it("shows a role-restricted item only to listed roles", () => {
    const dashboard: TopNavItem = topNavItems.find((i) => i.id === "dashboard")!;
    expect(isNavItemVisible(dashboard, "owner")).toBe(true);
    expect(isNavItemVisible(dashboard, "admin")).toBe(true);
    expect(isNavItemVisible(dashboard, "cleaner")).toBe(false);
  });

  it("hides a role-restricted item while the role is still null (no flash of owner tabs)", () => {
    expect(isNavItemVisible(settingsNavItem, null)).toBe(false);
  });
});

describe("role-driven top-nav visibility", () => {
  it("owner sees all five top-nav items and Settings", () => {
    expect(visibleTopNavIds("owner")).toEqual([
      "dashboard",
      "calendar",
      "messaging",
      "operations",
      "reporting",
    ]);
    expect(isNavItemVisible(settingsNavItem, "owner")).toBe(true);
  });

  it("admin sees all five top-nav items and Settings", () => {
    expect(visibleTopNavIds("admin")).toEqual([
      "dashboard",
      "calendar",
      "messaging",
      "operations",
      "reporting",
    ]);
    expect(isNavItemVisible(settingsNavItem, "admin")).toBe(true);
  });

  it("cleaner sees only Calendar, Messaging, Operations and no Settings", () => {
    expect(visibleTopNavIds("cleaner")).toEqual(["calendar", "messaging", "operations"]);
    expect(visibleTopNavIds("cleaner")).not.toContain("dashboard");
    expect(visibleTopNavIds("cleaner")).not.toContain("reporting");
    expect(isNavItemVisible(settingsNavItem, "cleaner")).toBe(false);
  });
});
