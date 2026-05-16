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

import { SettingsNavSection } from "./settings-nav-section";

describe("SettingsNavSection", () => {
  beforeEach(() => {
    setSectionMock.mockReset();
    pushMock.mockReset();
    pathnameMock.mockReturnValue("/settings");
  });

  it("renders only section buttons, no sub-route links", () => {
    render(<SettingsNavSection />);
    expect(screen.getByRole("button", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /phone/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sync logs/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /shareable links/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /listings/i })).not.toBeInTheDocument();
  });

  it("clicking a section on /settings does not navigate, only updates state", async () => {
    render(<SettingsNavSection />);
    await userEvent.click(screen.getByRole("button", { name: /phone/i }));
    expect(setSectionMock).toHaveBeenCalledWith("phone");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clicking a section while on a sub-route navigates back to /settings", async () => {
    pathnameMock.mockReturnValue("/settings/sync-logs");
    render(<SettingsNavSection />);
    await userEvent.click(screen.getByRole("button", { name: /phone/i }));
    expect(setSectionMock).toHaveBeenCalledWith("phone");
    expect(pushMock).toHaveBeenCalledWith("/settings");
  });
});
