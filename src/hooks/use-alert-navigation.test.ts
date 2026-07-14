import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AlertItem } from "@/hooks/use-dashboard";

const { setSubmenuMock, pushMock } = vi.hoisted(() => ({
  setSubmenuMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector({ setSubmenu: setSubmenuMock }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { useAlertNavigation } from "./use-alert-navigation";

function alert(type: AlertItem["type"]): AlertItem {
  return { id: "a1", type, severity: "red", description: "test alert", count: 1 };
}

describe("useAlertNavigation", () => {
  beforeEach(() => {
    setSubmenuMock.mockReset();
    pushMock.mockReset();
  });

  it("message: filters messaging to unread and navigates there", () => {
    const { result } = renderHook(() => useAlertNavigation());
    result.current(alert("message"));
    expect(setSubmenuMock).toHaveBeenCalledWith("messaging", ["unread"]);
    expect(pushMock).toHaveBeenCalledWith("/messaging");
  });

  it("unscheduled: filters operations to cleaning and navigates there", () => {
    const { result } = renderHook(() => useAlertNavigation());
    result.current(alert("unscheduled"));
    expect(setSubmenuMock).toHaveBeenCalledWith("operations", ["cleaning"]);
    expect(pushMock).toHaveBeenCalledWith("/operations");
  });

  it("past-due-clean: filters operations to cleaning and navigates there", () => {
    const { result } = renderHook(() => useAlertNavigation());
    result.current(alert("past-due-clean"));
    expect(setSubmenuMock).toHaveBeenCalledWith("operations", ["cleaning"]);
    expect(pushMock).toHaveBeenCalledWith("/operations");
  });

  it("ticket: filters operations to tickets and navigates there", () => {
    const { result } = renderHook(() => useAlertNavigation());
    result.current(alert("ticket"));
    expect(setSubmenuMock).toHaveBeenCalledWith("operations", ["tickets"]);
    expect(pushMock).toHaveBeenCalledWith("/operations");
  });

  it("sync: navigates to settings without touching the submenu filter", () => {
    const { result } = renderHook(() => useAlertNavigation());
    result.current(alert("sync"));
    expect(setSubmenuMock).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/settings");
  });
});
