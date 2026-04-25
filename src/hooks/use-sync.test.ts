import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({
    get: getMock,
    post: postMock,
  }),
  useAuthReady: () => true,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { accessToken: "mock" }, status: "authenticated" }),
}));

import { useSyncLogs, useTriggerSync } from "./use-sync";

function withProvider(): {
  client: QueryClient;
  Wrapper: (props: { children: ReactNode }) => ReactNode;
} {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return { client, Wrapper };
}

describe("use-sync hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it("useSyncLogs requests /sync/logs with paging params and unwraps envelope", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "log-1",
          listingId: "listing-1",
          startedAt: "2026-04-25T10:00:00Z",
          completedAt: "2026-04-25T10:00:30Z",
          status: "success",
          bookingsCreated: 2,
          bookingsUpdated: 1,
          bookingsUnchanged: 5,
          errorMessage: null,
          createdAt: "2026-04-25T10:00:00Z",
        },
      ],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
    });

    const { Wrapper } = withProvider();
    const { result } = renderHook(() => useSyncLogs(2, 50), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/sync/logs?page=2&page_size=50");
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.meta.total).toBe(1);
  });

  it("useTriggerSync POSTs /sync/trigger and unwraps response data", async () => {
    postMock.mockResolvedValue({
      data: {
        listingsSynced: 4,
        listingsFailed: 0,
        bookingsCreated: 6,
        bookingsUpdated: 2,
        bookingsUnchanged: 12,
        conflictsDetected: 1,
      },
    });

    const { Wrapper } = withProvider();
    const { result } = renderHook(() => useTriggerSync(), { wrapper: Wrapper });

    const response = await result.current.mutateAsync();
    expect(postMock).toHaveBeenCalledWith("/sync/trigger", {});
    expect(response.bookingsCreated).toBe(6);
  });

  it("useTriggerSync invalidates listings, sync, and bookings queries", async () => {
    postMock.mockResolvedValue({
      data: {
        listingsSynced: 1,
        listingsFailed: 0,
        bookingsCreated: 0,
        bookingsUpdated: 0,
        bookingsUnchanged: 0,
        conflictsDetected: 0,
      },
    });

    const { client, Wrapper } = withProvider();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useTriggerSync(), { wrapper: Wrapper });
    await result.current.mutateAsync();

    const calls = invalidateSpy.mock.calls.map(([arg]) => arg?.queryKey);
    expect(calls).toContainEqual(["listings"]);
    expect(calls).toContainEqual(["sync"]);
    expect(calls).toContainEqual(["bookings"]);
  });
});
