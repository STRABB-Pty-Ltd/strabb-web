import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserRole } from "@/types/auth";

const useSessionMock = vi.fn();
const signOutMock = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

// BillingNavPill fetches its own data; stub it so the nav test stays focused on
// role-driven item visibility and needs no QueryClient.
vi.mock("@/components/billing/billing-nav-pill", () => ({
  BillingNavPill: () => null,
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({ currentPage: "dashboard", setCurrentPage: vi.fn() }),
}));

import { TopNav } from "./top-nav";

function mockRole(role: UserRole) {
  useSessionMock.mockReturnValue({
    data: { role, currentUser: { role } },
    status: "authenticated",
  });
}

function linkNames(): string[] {
  return screen.getAllByRole("link").map((el) => el.textContent?.trim() ?? "");
}

describe("TopNav role-aware visibility", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    signOutMock.mockReset();
  });

  it.each(["owner", "admin"] as const)("shows every tab and Settings for %s", (role) => {
    mockRole(role);
    render(<TopNav />);
    for (const label of ["Dashboard", "Calendar", "Messaging", "Operations", "Reporting"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("hides Dashboard, Reporting and Settings for a cleaner but keeps the rest", () => {
    mockRole("cleaner");
    render(<TopNav />);
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Reporting" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Messaging" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Operations" })).toBeInTheDocument();
    // Exactly the three cleaner-visible tabs, nothing else.
    expect(linkNames().sort()).toEqual(["Calendar", "Messaging", "Operations"]);
  });

  it("renders a Sign out control that signs out back to /login", async () => {
    mockRole("owner");
    render(<TopNav />);
    const button = screen.getByRole("button", { name: "Sign out" });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
