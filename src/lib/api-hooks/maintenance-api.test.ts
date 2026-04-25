import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, postMock, putMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
  }),
  useAuthReady: () => true,
}));

vi.mock("@/lib/mock-data", () => ({ USE_MOCK: false }));

import {
  useCreateMaintenanceAPI,
  useDeleteMaintenanceAPI,
  useMaintenance,
  useMaintenanceAPI,
  useUpdateMaintenanceAPI,
} from "./maintenance-api";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("maintenance-api hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
  });

  it("useMaintenanceAPI fetches with default pagination", async () => {
    getMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    });

    const { result } = renderHook(() => useMaintenanceAPI(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/maintenance?page=1&page_size=20");
  });

  it("useMaintenanceAPI applies status, priority, and date filters", async () => {
    getMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    });

    const { result } = renderHook(
      () =>
        useMaintenanceAPI({
          status: "reported",
          priority: "high",
          dateFrom: "2026-04-01",
          dateTo: "2026-04-30",
          page: 2,
        }),
      { wrapper: withProvider() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith(
      "/maintenance?status=reported&priority=high&date_from=2026-04-01&date_to=2026-04-30&page=2&page_size=20",
    );
  });

  it("useMaintenance(id) fetches detail and unwraps envelope", async () => {
    const maintenance = {
      id: "maint-1",
      propertyId: "prop-1",
      listingId: null,
      description: "Leaking tap",
      priority: "high",
      status: "reported",
      dateReported: "2026-04-25T00:00:00Z",
      dateScheduled: null,
      dateCompleted: null,
      cost: null,
      notes: null,
      createdAt: "2026-04-25T00:00:00Z",
      updatedAt: "2026-04-25T00:00:00Z",
    };
    getMock.mockResolvedValue({ data: maintenance });

    const { result } = renderHook(() => useMaintenance("maint-1"), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/maintenance/maint-1");
    expect(result.current.data).toEqual(maintenance);
  });

  it("useMaintenance(null) is disabled and never fetches", () => {
    const { result } = renderHook(() => useMaintenance(null), { wrapper: withProvider() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("create / update / delete mutations call the right endpoints", async () => {
    postMock.mockResolvedValue({ data: { id: "new" } });
    putMock.mockResolvedValue({ data: { id: "edited" } });
    deleteMock.mockResolvedValue(undefined);

    const create = renderHook(() => useCreateMaintenanceAPI(), { wrapper: withProvider() });
    await create.result.current.mutateAsync({ description: "x" });
    expect(postMock).toHaveBeenCalledWith("/maintenance", { description: "x" });

    const update = renderHook(() => useUpdateMaintenanceAPI(), { wrapper: withProvider() });
    await update.result.current.mutateAsync({ id: "abc", data: { description: "y" } });
    expect(putMock).toHaveBeenCalledWith("/maintenance/abc", { description: "y" });

    const del = renderHook(() => useDeleteMaintenanceAPI(), { wrapper: withProvider() });
    await del.result.current.mutateAsync("abc");
    expect(deleteMock).toHaveBeenCalledWith("/maintenance/abc");
  });
});
