import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "@/stores/app-store";
import { topNavItems, settingsNavItem } from "@/lib/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));

// BillingNavPill (mounted inside TopNav) calls useBillingStatus → useSession.
// Stub the hook so the nav test can render TopNav without a SessionProvider.
vi.mock("@/hooks/use-billing", () => ({
  useBillingStatus: () => ({ data: undefined }),
}));

// Mock next/link to render a plain <a>
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

// Import after mocks
const { TopNav } = await import("@/components/shell/top-nav");

describe("Navigation integration", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("renders all 5 page buttons plus settings", () => {
    render(<TopNav />);

    for (const item of topNavItems) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
    expect(screen.getByText(settingsNavItem.label)).toBeInTheDocument();
  });

  it("clicking a page button updates currentPage in store", async () => {
    const user = userEvent.setup();
    render(<TopNav />);

    expect(useAppStore.getState().currentPage).toBe("dashboard");

    await user.click(screen.getByText("Calendar"));
    expect(useAppStore.getState().currentPage).toBe("calendar");

    await user.click(screen.getByText("Messaging"));
    expect(useAppStore.getState().currentPage).toBe("messaging");

    await user.click(screen.getByText("Settings"));
    expect(useAppStore.getState().currentPage).toBe("settings");
  });

  it("sets previousPage when navigating", async () => {
    const user = userEvent.setup();
    render(<TopNav />);

    await user.click(screen.getByText("Calendar"));
    expect(useAppStore.getState().previousPage).toBe("dashboard");

    await user.click(screen.getByText("Operations"));
    expect(useAppStore.getState().previousPage).toBe("calendar");
  });

  it("highlights the active page with aria-current", () => {
    useAppStore.getState().setCurrentPage("messaging");
    const { container } = render(<TopNav />);

    const activeLink = container.querySelector('[aria-current="page"]');
    expect(activeLink).toBeInTheDocument();
    expect(activeLink?.textContent).toContain("Messaging");
  });
});
