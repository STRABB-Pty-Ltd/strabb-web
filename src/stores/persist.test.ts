import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "./app-store";

// Guards the fix for the "report resets to current-month / all-listings on
// reload" bug: the owner's listing filter + picked reporting period must be
// persisted and restored on rehydrate (what app-shell runs on mount).
describe("app-store persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => useAppStore.setState(useAppStore.getInitialState()));
  });

  it("persists the listing filter + reporting period and restores them on rehydrate", async () => {
    // A "previous session": the owner filters to Bannockburn Lodge and picks May.
    act(() => {
      useAppStore.getState().setSelectedListings(["lst-lodge"]);
      useAppStore.getState().setTimeframe("reporting", "month", "2026-05-01");
    });

    const raw = window.localStorage.getItem("strabb-app-store");
    expect(raw).toBeTruthy();
    expect(raw).toContain("lst-lodge");
    expect(raw).toContain("2026-05-01");

    // A full reload wipes in-memory state back to defaults (skipHydration).
    // Capture the stored blob first, since resetting rewrites localStorage.
    const stored = raw as string;
    act(() => useAppStore.setState(useAppStore.getInitialState()));
    expect(useAppStore.getState().selectedListings).toEqual([]);
    expect(useAppStore.getState().reporting.anchor).toBeNull();

    // Restore the "previous session" blob and rehydrate (app-shell on mount).
    window.localStorage.setItem("strabb-app-store", stored);
    await act(async () => {
      await useAppStore.persist.rehydrate();
    });

    expect(useAppStore.getState().selectedListings).toEqual(["lst-lodge"]);
    expect(useAppStore.getState().reporting.windowSize).toBe("month");
    expect(useAppStore.getState().reporting.anchor).toBe("2026-05-01");
  });

  it("does not persist transient overlay state (toasts / open popups)", () => {
    act(() => {
      useAppStore.getState().addToast({ type: "success", message: "hi" });
      useAppStore.getState().setSelectedListings(["lst-lodge"]);
    });
    const raw = window.localStorage.getItem("strabb-app-store") ?? "";
    expect(raw).toContain("lst-lodge");
    expect(raw).not.toContain("toasts");
    expect(raw).not.toContain("tfPopup");
  });
});
