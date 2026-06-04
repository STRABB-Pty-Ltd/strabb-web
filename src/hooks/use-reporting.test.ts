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

  it("saveCurrentReport POSTs the current name, timeframe and submenu", async () => {
    getMock.mockResolvedValue({ data: [] });
    postMock.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.savedReports).toHaveLength(0));

    act(() => result.current.saveCurrentReport("My Report"));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        "/saved-reports",
        expect.objectContaining({ name: "My Report" }),
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

  it("loadReport applies the saved report's timeframe and submenu to the view", async () => {
    getMock.mockResolvedValue({
      data: [{ id: "sr-1", name: "Q1", timeframe: "quarter", submenu: ["revenue", "expenses"] }],
    });
    const { result } = renderHook(() => useSavedReports(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.savedReports).toHaveLength(1));

    act(() => result.current.loadReport("sr-1"));

    const reporting = useAppStore.getState().reporting;
    expect(reporting.windowSize).toBe("quarter");
    expect(reporting.submenu).toEqual(["revenue", "expenses"]);
    expect(reporting.activeSavedReport).toBe("sr-1");
  });
});
