import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, postMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({
    get: getMock,
    post: postMock,
    put: vi.fn(),
    delete: deleteMock,
  }),
  useAuthReady: () => true,
}));

import { useAppStore } from "@/stores/app-store";

import { useSavedReports } from "./use-reporting";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("useSavedReports (persisted via /saved-reports)", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("lists saved reports from GET /saved-reports", async () => {
    getMock.mockResolvedValue({
      data: [{ id: "sr-1", name: "Q1 review", timeframe: "month", submenu: ["revenue"] }],
    });
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });

    await waitFor(() => expect(result.current.savedReports).toHaveLength(1));
    expect(getMock).toHaveBeenCalledWith("/saved-reports");
    expect(result.current.savedReports[0]).toMatchObject({ id: "sr-1", name: "Q1 review" });
  });

  it("saveCurrentReport POSTs the pinned month (anchor) + listing selection + chips, and confirms with a toast", async () => {
    getMock.mockResolvedValue({ data: [] });
    postMock.mockResolvedValue({ data: {} });
    // Pin a specific month + a listing so the saved snapshot must capture both.
    act(() => useAppStore.getState().setTimeframe("reporting", "month", "2026-05-01"));
    act(() => useAppStore.getState().setSubmenu("reporting", ["revenue"]));
    act(() => useAppStore.getState().setSelectedListings(["lst-lodge"]));
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.savedReports).toHaveLength(0));

    act(() => result.current.saveCurrentReport("My Report"));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith("/saved-reports", {
        name: "My Report",
        timeframe: "month",
        submenu: ["revenue"],
        listingIds: ["lst-lodge"],
        configJson: { anchor: "2026-05-01" },
      }),
    );
    await waitFor(() =>
      expect(useAppStore.getState().toasts).toContainEqual(
        expect.objectContaining({ type: "success", message: 'Saved report "My Report"' }),
      ),
    );
  });

  it("saveCurrentReport surfaces a failed POST as an error toast (no silent failure)", async () => {
    getMock.mockResolvedValue({ data: [] });
    postMock.mockRejectedValue(new Error("Forbidden"));
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.savedReports).toHaveLength(0));

    act(() => result.current.saveCurrentReport("My Report"));

    await waitFor(() =>
      expect(useAppStore.getState().toasts).toContainEqual(
        expect.objectContaining({ type: "error", message: "Forbidden" }),
      ),
    );
  });

  it("deleteReport DELETEs by id", async () => {
    getMock.mockResolvedValue({ data: [] });
    deleteMock.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.savedReports).toHaveLength(0));

    act(() => result.current.deleteReport("sr-9"));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("/saved-reports/sr-9"));
  });

  it("loadReport restores the saved month (anchor), chips, and listing selection", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "sr-1",
          name: "May / Lodge",
          timeframe: "month",
          submenu: ["revenue", "expenses"],
          listingIds: ["lst-lodge"],
          configJson: { anchor: "2026-05-01" },
        },
      ],
    });
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.savedReports).toHaveLength(1));

    act(() => result.current.loadReport("sr-1"));

    const reporting = useAppStore.getState().reporting;
    expect(reporting.windowSize).toBe("month");
    // The pinned month reloads as May, not the current month.
    expect(reporting.anchor).toBe("2026-05-01");
    expect(reporting.submenu).toEqual(["revenue", "expenses"]);
    expect(useAppStore.getState().selectedListings).toEqual(["lst-lodge"]);
    expect(reporting.activeSavedReport).toBe("sr-1");
  });

  it("loadReport of a current-period save (null anchor, no listings) reloads current period / whole portfolio", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "sr-2",
          name: "This month",
          timeframe: "month",
          submenu: ["overview"],
          listingIds: [],
          configJson: { anchor: null },
        },
      ],
    });
    // Dirty the store first so the load is observably resetting it.
    act(() => {
      useAppStore.getState().setTimeframe("reporting", "month", "2026-05-01");
      useAppStore.getState().setSelectedListings(["lst-lodge"]);
    });
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.savedReports).toHaveLength(1));

    act(() => result.current.loadReport("sr-2"));

    expect(useAppStore.getState().reporting.anchor).toBeNull();
    expect(useAppStore.getState().selectedListings).toEqual([]);
  });

  it("resetToDefaultView restores the default Overview view and clears the active report", async () => {
    getMock.mockResolvedValue({
      data: [{ id: "sr-1", name: "Q1", timeframe: "quarter", submenu: ["revenue", "expenses"] }],
    });
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.savedReports).toHaveLength(1));

    // Load a report first so there is something to reset away from.
    act(() => result.current.loadReport("sr-1"));
    expect(useAppStore.getState().reporting.activeSavedReport).toBe("sr-1");

    act(() => result.current.resetToDefaultView());

    const reporting = useAppStore.getState().reporting;
    expect(reporting.windowSize).toBe("month");
    expect(reporting.submenu).toEqual(["overview"]);
    expect(reporting.activeSavedReport).toBeNull();
  });

  it("clears the active saved report when the user manually diverges (granularity or chips), but not on a period step", async () => {
    getMock.mockResolvedValue({
      data: [{ id: "sr-1", name: "Q1", timeframe: "quarter", submenu: ["revenue"] }],
    });
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.savedReports).toHaveLength(1));

    // Manual granularity change diverges from the preset -> highlight clears.
    act(() => result.current.loadReport("sr-1"));
    expect(useAppStore.getState().reporting.activeSavedReport).toBe("sr-1");
    act(() => useAppStore.getState().setTimeframe("reporting", "month"));
    expect(useAppStore.getState().reporting.activeSavedReport).toBeNull();

    // Manual chip toggle also clears.
    act(() => result.current.loadReport("sr-1"));
    expect(useAppStore.getState().reporting.activeSavedReport).toBe("sr-1");
    act(() => useAppStore.getState().toggleSubmenuChip("reporting", "expenses"));
    expect(useAppStore.getState().reporting.activeSavedReport).toBeNull();

    // Stepping the period (anchor) does NOT clear - a preset is granularity + chips.
    act(() => result.current.loadReport("sr-1"));
    act(() => useAppStore.getState().setTimeframeAnchor("reporting", "2026-01"));
    expect(useAppStore.getState().reporting.activeSavedReport).toBe("sr-1");
  });
});
