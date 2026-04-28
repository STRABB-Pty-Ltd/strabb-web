import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock }),
  useAuthReady: () => true,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { accessToken: "mock" }, status: "authenticated" }),
}));

import { useFailedMessages, useSyncErrors, useSystemHealth } from "./use-admin";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("use-admin hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("useSystemHealth hits /admin/health", async () => {
    getMock.mockResolvedValue({
      data: {
        syncErrors: 0,
        listingsErrored: 0,
        tasksFailed: 0,
        messagesFailed: 0,
        notificationFailures: 0,
        hasIssues: false,
      },
    });
    const { result } = renderHook(() => useSystemHealth(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/admin/health");
  });

  it("useSyncErrors hits /admin/sync-errors", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useSyncErrors(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/admin/sync-errors");
  });

  it("useFailedMessages hits /admin/failed-messages", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useFailedMessages(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/admin/failed-messages");
  });
});
