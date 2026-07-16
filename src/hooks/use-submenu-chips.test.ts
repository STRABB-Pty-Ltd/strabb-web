import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "@/stores/app-store";

// single-default/exclusive/more-dropdown behaviors already have thorough
// coverage via the real submenuConfigs in
// src/__tests__/integration/submenu-chips.test.tsx (through SubmenuBar).
// toggle/multi/nav aren't used by any real page config today, so this file
// injects a synthetic config to reach that unused-but-supported logic
// directly on the hook.
vi.mock("@/lib/submenu-config", () => ({
  submenuConfigs: {
    dashboard: [
      { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
      { id: "starred", label: "Starred", behavior: "toggle" },
      { id: "a", label: "A", behavior: "multi" },
      { id: "b", label: "B", behavior: "multi" },
      { id: "reports", label: "Reports", behavior: "nav", href: "/dashboard/reports" },
    ],
    calendar: [],
    messaging: [],
    operations: [],
    reporting: [],
  },
}));

const { pushMock, pathnameRef } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  pathnameRef: { current: "/dashboard" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => pathnameRef.current,
}));

const { useSubmenuChips } = await import("./use-submenu-chips");

describe("useSubmenuChips", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
    useAppStore.getState().setCurrentPage("dashboard");
    pushMock.mockReset();
    pathnameRef.current = "/dashboard";
  });

  it("toggle: clicking flips the chip in and out of the active set", () => {
    const { result } = renderHook(() => useSubmenuChips());
    const starred = result.current.chips.find((c) => c.id === "starred")!;

    act(() => result.current.handleChipClick(starred));
    expect(useAppStore.getState().dashboard.submenu).toContain("starred");

    act(() => result.current.handleChipClick(starred));
    expect(useAppStore.getState().dashboard.submenu).not.toContain("starred");
  });

  it("multi: accumulates selections, dropping overview once something else is active", () => {
    const { result } = renderHook(() => useSubmenuChips());
    const a = result.current.chips.find((c) => c.id === "a")!;
    const b = result.current.chips.find((c) => c.id === "b")!;

    act(() => result.current.handleChipClick(a));
    expect(useAppStore.getState().dashboard.submenu).toEqual(["a"]);

    act(() => result.current.handleChipClick(b));
    expect(useAppStore.getState().dashboard.submenu).toEqual(["a", "b"]);
  });

  it("multi: deselecting the last active chip reverts to overview", () => {
    const { result } = renderHook(() => useSubmenuChips());
    const a = result.current.chips.find((c) => c.id === "a")!;

    act(() => result.current.handleChipClick(a));
    act(() => result.current.handleChipClick(a));

    expect(useAppStore.getState().dashboard.submenu).toEqual(["overview"]);
  });

  it("nav: clicking navigates to href, clicking again while on it returns to the page root", () => {
    const { result, rerender } = renderHook(() => useSubmenuChips());
    const reports = result.current.chips.find((c) => c.id === "reports")!;

    act(() => result.current.handleChipClick(reports));
    expect(pushMock).toHaveBeenCalledWith("/dashboard/reports");

    pathnameRef.current = "/dashboard/reports";
    rerender();
    act(() => result.current.handleChipClick(reports));
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("isChipActive: no chip is active while on a nav chip's sub-route, even overview", () => {
    pathnameRef.current = "/dashboard/reports";
    const { result } = renderHook(() => useSubmenuChips());
    const overview = result.current.chips.find((c) => c.id === "overview")!;
    const reports = result.current.chips.find((c) => c.id === "reports")!;

    expect(result.current.isChipActive(overview)).toBe(false);
    expect(result.current.isChipActive(reports)).toBe(true);
  });

  it("clicking a non-nav chip while on a nav sub-route routes back to the page root", () => {
    pathnameRef.current = "/dashboard/reports";
    const { result } = renderHook(() => useSubmenuChips());
    const starred = result.current.chips.find((c) => c.id === "starred")!;

    act(() => result.current.handleChipClick(starred));
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("moreOpen resets when currentPage changes", () => {
    const { result } = renderHook(() => useSubmenuChips());
    act(() => result.current.setMoreOpen(true));
    expect(result.current.moreOpen).toBe(true);

    act(() => useAppStore.getState().setCurrentPage("calendar"));
    expect(result.current.moreOpen).toBe(false);
  });

  it("returns no chips on settings, matching SubmenuBar's own special case", () => {
    act(() => useAppStore.getState().setCurrentPage("settings"));
    const { result } = renderHook(() => useSubmenuChips());
    expect(result.current.chips).toEqual([]);
  });
});
