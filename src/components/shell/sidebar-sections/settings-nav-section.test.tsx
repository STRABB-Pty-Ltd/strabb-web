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

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href as string} {...rest}>
      {children}
    </a>
  ),
}));

import { SettingsNavSection } from "./settings-nav-section";

describe("SettingsNavSection", () => {
  beforeEach(() => {
    setSectionMock.mockReset();
    pushMock.mockReset();
    pathnameMock.mockReturnValue("/settings");
  });

  it("renders all section buttons plus the sub-route links", () => {
    render(<SettingsNavSection />);
    expect(screen.getByRole("button", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /phone/i })).toBeInTheDocument();
    const syncLogsLink = screen.getByRole("link", { name: /sync logs/i });
    expect(syncLogsLink).toHaveAttribute("href", "/settings/sync-logs");
  });

  it("clicking a section on /settings does not navigate, only updates state", async () => {
    render(<SettingsNavSection />);
    await userEvent.click(screen.getByRole("button", { name: /phone/i }));
    expect(setSectionMock).toHaveBeenCalledWith("phone");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clicking a section while on /settings/sync-logs navigates back to /settings", async () => {
    pathnameMock.mockReturnValue("/settings/sync-logs");
    render(<SettingsNavSection />);
    await userEvent.click(screen.getByRole("button", { name: /phone/i }));
    expect(setSectionMock).toHaveBeenCalledWith("phone");
    expect(pushMock).toHaveBeenCalledWith("/settings");
  });

  it("Sync logs link is marked aria-current when on /settings/sync-logs", () => {
    pathnameMock.mockReturnValue("/settings/sync-logs");
    render(<SettingsNavSection />);
    expect(screen.getByRole("link", { name: /sync logs/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
