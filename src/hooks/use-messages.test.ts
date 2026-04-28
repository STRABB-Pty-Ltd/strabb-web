import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock, post: postMock }),
  useAuthReady: () => true,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { accessToken: "mock-token" },
    status: "authenticated",
  }),
}));

import { useMessageLogs, useResendMessage, useScheduledMessages } from "./use-messages";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("use-messages hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it("useScheduledMessages defaults to page 1, page_size 20, no status", async () => {
    getMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    });

    const { result } = renderHook(() => useScheduledMessages(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/messages/scheduled?page=1&page_size=20");
  });

  it("useScheduledMessages includes status filter in query string", async () => {
    getMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    });

    const { result } = renderHook(
      () => useScheduledMessages({ status: "failed", page: 2, pageSize: 50 }),
      { wrapper: withProvider() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/messages/scheduled?status=failed&page=2&page_size=50");
  });

  it("useScheduledMessages keeps backwards-compatible string bookingId arg", async () => {
    getMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    });

    const { result } = renderHook(() => useScheduledMessages("booking-123"), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith(
      "/messages/scheduled?booking_id=booking-123&page=1&page_size=20",
    );
  });

  it("useMessageLogs hits /messages/logs with pagination", async () => {
    getMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    });

    const { result } = renderHook(() => useMessageLogs(3, 25), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/messages/logs?page=3&page_size=25");
  });

  it("useResendMessage POSTs to the right URL", async () => {
    postMock.mockResolvedValue({ data: { sent: true } });

    const { result } = renderHook(() => useResendMessage(), { wrapper: withProvider() });
    await result.current.mutateAsync("msg-1");

    expect(postMock).toHaveBeenCalledWith("/messages/scheduled/msg-1/resend", {});
  });
});
