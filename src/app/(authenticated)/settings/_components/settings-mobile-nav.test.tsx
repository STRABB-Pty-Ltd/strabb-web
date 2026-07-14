import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { setSectionMock, pushMock, pathnameMock } = vi.hoisted(() => ({
  setSectionMock: vi.fn(),
  pushMock: vi.fn(),
  pathnameMock: vi.fn(() => "/settings"),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      settings: { section: "general" },
      setSection: setSectionMock,
    }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useRouter: () => ({ push: pushMock }),
}));

import { SettingsMobileNav } from "./settings-mobile-nav";

describe("SettingsMobileNav", () => {
  beforeEach(() => {
    setSectionMock.mockReset();
    pushMock.mockReset();
    pathnameMock.mockReturnValue("/settings");
  });

  it("renders all section chips including Listings", () => {
    render(<SettingsMobileNav />);
    expect(screen.getByRole("button", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /billing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /listings/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /channels/i })).toBeInTheDocument();
  });

  it("clicking a section on /settings does not navigate, only updates state", async () => {
    render(<SettingsMobileNav />);
    await userEvent.click(screen.getByRole("button", { name: /billing/i }));
    expect(setSectionMock).toHaveBeenCalledWith("billing");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clicking a section while on a sub-route navigates back to /settings", async () => {
    pathnameMock.mockReturnValue("/settings/listings");
    render(<SettingsMobileNav />);
    await userEvent.click(screen.getByRole("button", { name: /billing/i }));
    expect(setSectionMock).toHaveBeenCalledWith("billing");
    expect(pushMock).toHaveBeenCalledWith("/settings");
  });

  it("clicking Listings navigates to its route without touching section state", async () => {
    render(<SettingsMobileNav />);
    await userEvent.click(screen.getByRole("button", { name: /listings/i }));
    expect(pushMock).toHaveBeenCalledWith("/settings/listings");
    expect(setSectionMock).not.toHaveBeenCalled();
  });

  it("marks Listings active on its route, with state sections inactive", () => {
    pathnameMock.mockReturnValue("/settings/listings");
    render(<SettingsMobileNav />);
    expect(screen.getByRole("button", { name: /listings/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: /general/i })).not.toHaveAttribute("aria-current");
  });
});
